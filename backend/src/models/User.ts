import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  plan: 'free' | 'pro' | 'enterprise';
  isEmailVerified: boolean;
  stripeCustomerId?: string;
  // Community fields
  role: 'admin' | 'moderator' | 'subscriber' | 'premium';
  avatarUrl?: string;
  bio?: string;
  reputationScore: number;
  isBanned: boolean;
  bannedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: {
    type: String
  },
  // Community fields
  role: {
    type: String,
    enum: ['admin', 'moderator', 'subscriber', 'premium'],
    default: 'subscriber'
  },
  avatarUrl: {
    type: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  reputationScore: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);