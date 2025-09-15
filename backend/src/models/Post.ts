import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  newsletterId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  status: 'draft' | 'scheduled' | 'published' | 'sent';
  publishedAt?: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  slug: string;
  featured: boolean;
  tags: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  analytics: {
    opens: number;
    uniqueOpens: number;
    clicks: number;
    uniqueClicks: number;
    unsubscribes: number;
    revenue: number;
    emailsSent: number;
    bounces: number;
    complaints: number;
  };
  emailConfig: {
    subject: string;
    preheader?: string;
    fromName?: string;
    replyTo?: string;
    segments?: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  newsletterId: {
    type: Schema.Types.ObjectId,
    ref: 'Newsletter',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'sent'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    ogImage: String
  },
  analytics: {
    opens: {
      type: Number,
      default: 0
    },
    uniqueOpens: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    unsubscribes: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    bounces: {
      type: Number,
      default: 0
    },
    complaints: {
      type: Number,
      default: 0
    }
  },
  emailConfig: {
    subject: {
      type: String,
      required: true
    },
    preheader: String,
    fromName: String,
    replyTo: String,
    segments: [{
      type: Schema.Types.ObjectId,
      ref: 'Segment'
    }]
  }
}, {
  timestamps: true
});

// Create slug from title before saving
postSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes for better query performance
postSchema.index({ newsletterId: 1, status: 1 });
postSchema.index({ newsletterId: 1, publishedAt: -1 });
postSchema.index({ slug: 1, newsletterId: 1 }, { unique: true });
postSchema.index({ status: 1, scheduledAt: 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);