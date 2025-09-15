import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
  _id: string;
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  subdomain?: string;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  settings: {
    isPublic: boolean;
    allowComments: boolean;
    doubleOptIn: boolean;
    unsubscribeFooter: string;
  };
  monetization: {
    hasPaidTiers: boolean;
    paidTiers: Array<{
      name: string;
      price: number;
      currency: string;
      interval: 'month' | 'year';
      stripePriceId?: string;
    }>;
  };
  monthlyRevenue?: number;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>({
  name: {
    type: String,
    required: [true, 'Please add a newsletter name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  customDomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  branding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#64748B'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    }
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    doubleOptIn: {
      type: Boolean,
      default: true
    },
    unsubscribeFooter: {
      type: String,
      default: 'You received this email because you subscribed to our newsletter. Unsubscribe here.'
    }
  },
  monetization: {
    hasPaidTiers: {
      type: Boolean,
      default: false
    },
    paidTiers: [{
      name: String,
      price: Number,
      currency: {
        type: String,
        default: 'usd'
      },
      interval: {
        type: String,
        enum: ['month', 'year'],
        default: 'month'
      },
      stripePriceId: String
    }]
  },
  monthlyRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
newsletterSchema.index({ userId: 1 });
newsletterSchema.index({ subdomain: 1 }, { sparse: true });
newsletterSchema.index({ customDomain: 1 }, { sparse: true });

export const Newsletter = mongoose.model<INewsletter>('Newsletter', newsletterSchema);