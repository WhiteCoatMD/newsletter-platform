import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityReply extends Document {
  _id: string;
  content: string;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  parentReplyId?: mongoose.Types.ObjectId;
  depth: number;
  likesCount: number;
  dislikesCount: number;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityReplySchema = new Schema<ICommunityReply>({
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentReplyId: {
    type: Schema.Types.ObjectId,
    ref: 'CommunityReply'
  },
  depth: {
    type: Number,
    default: 0,
    max: 3 // Maximum nesting depth
  },
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Mark as edited when content is modified
communityReplySchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Indexes for better query performance
communityReplySchema.index({ postId: 1, isDeleted: 1 });
communityReplySchema.index({ authorId: 1, isDeleted: 1 });
communityReplySchema.index({ parentReplyId: 1, isDeleted: 1 });
communityReplySchema.index({ postId: 1, createdAt: 1 });

export const CommunityReply = mongoose.model<ICommunityReply>('CommunityReply', communityReplySchema);