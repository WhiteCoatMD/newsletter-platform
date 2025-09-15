import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriber extends Document {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  newsletterId: mongoose.Types.ObjectId;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscriptionType: 'free' | 'paid';
  paidTier?: string;
  stripeSubscriptionId?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  doubleOptInConfirmedAt?: Date;
  source: 'website' | 'import' | 'api' | 'referral' | 'social';
  referralSource?: string;
  tags: string[];
  customFields: Map<string, any>;
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    ip?: string;
  };
  engagement: {
    totalOpens: number;
    totalClicks: number;
    lastOpenedAt?: Date;
    lastClickedAt?: Date;
    openRate: number;
    clickRate: number;
    subscriptionScore: number; // 0-100 engagement score
  };
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'immediate';
    categories: string[];
    emailFormat: 'html' | 'text';
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please add a valid email'
    }
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  newsletterId: {
    type: Schema.Types.ObjectId,
    ref: 'Newsletter',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active'
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free'
  },
  paidTier: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  doubleOptInConfirmedAt: {
    type: Date
  },
  source: {
    type: String,
    enum: ['website', 'import', 'api', 'referral', 'social'],
    default: 'website'
  },
  referralSource: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    ip: String
  },
  engagement: {
    totalOpens: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    lastOpenedAt: Date,
    lastClickedAt: Date,
    openRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    clickRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    subscriptionScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'immediate'],
      default: 'weekly'
    },
    categories: [{
      type: String
    }],
    emailFormat: {
      type: String,
      enum: ['html', 'text'],
      default: 'html'
    }
  }
}, {
  timestamps: true
});

// Compound index for unique email per newsletter
subscriberSchema.index({ email: 1, newsletterId: 1 }, { unique: true });

// Other indexes for better query performance
subscriberSchema.index({ newsletterId: 1, status: 1 });
subscriberSchema.index({ newsletterId: 1, subscriptionType: 1 });
subscriberSchema.index({ newsletterId: 1, subscribedAt: -1 });
subscriberSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

// Calculate engagement scores before saving
subscriberSchema.pre('save', function(next) {
  // Update engagement score based on opens and clicks
  const totalEmails = this.engagement.totalOpens + this.engagement.totalClicks;
  if (totalEmails > 0) {
    this.engagement.openRate = (this.engagement.totalOpens / totalEmails) * 100;
    this.engagement.clickRate = (this.engagement.totalClicks / totalEmails) * 100;

    // Simple engagement score calculation
    this.engagement.subscriptionScore = Math.min(100,
      (this.engagement.openRate * 0.7) + (this.engagement.clickRate * 0.3)
    );
  }
  next();
});

export const Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);