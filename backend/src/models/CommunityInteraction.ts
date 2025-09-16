import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityInteraction extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  targetType: 'post' | 'reply';
  targetId: mongoose.Types.ObjectId;
  interactionType: 'like' | 'dislike' | 'bookmark';
  createdAt: Date;
}

const communityInteractionSchema = new Schema<ICommunityInteraction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'reply'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  interactionType: {
    type: String,
    enum: ['like', 'dislike', 'bookmark'],
    required: true
  }
}, {
  timestamps: true
});

// Virtual for determining target model
communityInteractionSchema.virtual('targetModel').get(function() {
  return this.targetType === 'post' ? 'CommunityPost' : 'CommunityReply';
});

// Compound unique index to prevent duplicate interactions
communityInteractionSchema.index(
  { userId: 1, targetType: 1, targetId: 1, interactionType: 1 },
  { unique: true }
);

// Indexes for querying
communityInteractionSchema.index({ userId: 1, interactionType: 1 });
communityInteractionSchema.index({ targetType: 1, targetId: 1, interactionType: 1 });

export const CommunityInteraction = mongoose.model<ICommunityInteraction>('CommunityInteraction', communityInteractionSchema);