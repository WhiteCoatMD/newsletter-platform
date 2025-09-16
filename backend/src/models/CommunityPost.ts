import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityPost extends Document {
  _id: string;
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  lastActivityAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [255, 'Title cannot exceed 255 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Update lastActivityAt on save
communityPostSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Indexes for better query performance
communityPostSchema.index({ category: 1, isDeleted: 1 });
communityPostSchema.index({ lastActivityAt: -1, isDeleted: 1 });
communityPostSchema.index({ isPinned: -1, lastActivityAt: -1 });
communityPostSchema.index({ isFeatured: 1, isDeleted: 1 });
communityPostSchema.index({ authorId: 1, isDeleted: 1 });

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);