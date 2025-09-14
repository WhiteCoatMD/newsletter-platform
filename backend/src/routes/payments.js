const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Newsletter, Subscriber } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create Stripe customer
// @route   POST /api/payments/create-customer
// @access  Private
router.post('/create-customer', protect, async (req, res) => {
  try {
    const user = req.user;

    // Check if user already has a Stripe customer ID
    if (user.subscription?.stripeCustomerId) {
      return res.json({
        success: true,
        data: { customerId: user.subscription.stripeCustomerId }
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user._id.toString()
      }
    });

    // Update user with customer ID
    await User.findByIdAndUpdate(user._id, {
      'subscription.stripeCustomerId': customer.id
    });

    res.json({
      success: true,
      data: { customerId: customer.id }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create subscription
// @route   POST /api/payments/create-subscription
// @access  Private
router.post('/create-subscription', protect, async (req, res) => {
  try {
    const { priceId, paymentMethodId } = req.body;
    const user = req.user;

    if (!user.subscription?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found. Please create customer first.'
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.subscription.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(user.subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: user.subscription.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user._id.toString()
      }
    });

    // Update user subscription
    const planMapping = {
      'price_launch': 'launch',
      'price_scale': 'scale',
      'price_max': 'max'
    };

    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': planMapping[priceId] || 'launch',
      'subscription.status': 'active',
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
    });

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Cancel subscription
// @route   POST /api/payments/cancel-subscription
// @access  Private
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update user subscription status
    await User.findByIdAndUpdate(user._id, {
      'subscription.status': 'canceled'
    });

    res.json({
      success: true,
      data: {
        subscription,
        message: 'Subscription will be canceled at the end of the current period'
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create payment intent for one-time payment
// @route   POST /api/payments/create-payment-intent
// @access  Private
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd', description, metadata } = req.body;
    const user = req.user;

    if (!user.subscription?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found. Please create customer first.'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: user.subscription.stripeCustomerId,
      description,
      metadata: {
        userId: user._id.toString(),
        ...metadata
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/payments/webhook
// @access  Public (but validated by Stripe)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// @desc    Get subscription plans and pricing
// @route   GET /api/payments/plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          'Up to 2,500 subscribers',
          'Basic newsletter editor',
          'Basic analytics',
          'Email support'
        ],
        limits: {
          subscribers: 2500,
          emails: 10000
        }
      },
      {
        id: 'launch',
        name: 'Launch',
        price: 39,
        interval: 'month',
        priceId: 'price_launch',
        features: [
          'Up to 10,000 subscribers',
          'Advanced editor',
          'A/B testing',
          'Advanced analytics',
          'Custom domains',
          'Priority support'
        ],
        limits: {
          subscribers: 10000,
          emails: 100000
        }
      },
      {
        id: 'scale',
        name: 'Scale',
        price: 99,
        interval: 'month',
        priceId: 'price_scale',
        features: [
          'Up to 100,000 subscribers',
          'All Launch features',
          'API access',
          'Advanced segmentation',
          'White label',
          'Phone support'
        ],
        limits: {
          subscribers: 100000,
          emails: 1000000
        }
      },
      {
        id: 'max',
        name: 'Max',
        price: 299,
        interval: 'month',
        priceId: 'price_max',
        features: [
          'Unlimited subscribers',
          'All Scale features',
          'Audio newsletters',
          'Advanced integrations',
          'Custom analytics',
          'Dedicated support'
        ],
        limits: {
          subscribers: -1,
          emails: -1
        }
      }
    ];

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper functions for webhook handlers
async function handleSubscriptionUpdate(subscription) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': subscription.customer
  });

  if (user) {
    const planMapping = {
      'price_launch': 'launch',
      'price_scale': 'scale',
      'price_max': 'max'
    };

    const priceId = subscription.items.data[0]?.price.id;
    const plan = planMapping[priceId] || 'free';

    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': plan,
      'subscription.status': subscription.status === 'active' ? 'active' : subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
    });
  }
}

async function handleSubscriptionCanceled(subscription) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': subscription.customer
  });

  if (user) {
    await User.findByIdAndUpdate(user._id, {
      'subscription.plan': 'free',
      'subscription.status': 'canceled',
      'subscription.stripeSubscriptionId': null
    });
  }
}

async function handlePaymentSucceeded(invoice) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': invoice.customer
  });

  if (user && invoice.subscription) {
    // Update subscription status and period end
    await User.findByIdAndUpdate(user._id, {
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': new Date(invoice.lines.data[0].period.end * 1000)
    });

    // Update newsletter revenue if applicable
    const newsletters = await Newsletter.find({ userId: user._id });
    const monthlyAmount = invoice.amount_paid / 100; // Convert from cents

    for (const newsletter of newsletters) {
      await Newsletter.findByIdAndUpdate(newsletter._id, {
        $inc: { monthlyRevenue: monthlyAmount / newsletters.length }
      });
    }
  }
}

async function handlePaymentFailed(invoice) {
  const user = await User.findOne({
    'subscription.stripeCustomerId': invoice.customer
  });

  if (user) {
    await User.findByIdAndUpdate(user._id, {
      'subscription.status': 'past_due'
    });
  }
}

module.exports = router;