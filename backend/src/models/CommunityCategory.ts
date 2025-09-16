import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityCategory extends Document {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communityCategorySchema = new Schema<ICommunityCategory>({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    required: true,
    default: '📝'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
communityCategorySchema.index({ isActive: 1, displayOrder: 1 });
communityCategorySchema.index({ name: 1 });

export const CommunityCategory = mongoose.model<ICommunityCategory>('CommunityCategory', communityCategorySchema);