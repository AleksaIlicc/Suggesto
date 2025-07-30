import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { ISuggestion } from './Suggestion';

export interface IVote extends Document {
  _id: string;
  user?: IUser; // Optional for anonymous votes
  sessionId?: string; // For anonymous voting
  suggestion: ISuggestion;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    sessionId: { type: String, required: false }, // For anonymous voting
    suggestion: { type: Schema.Types.ObjectId, ref: 'Suggestion', required: true },
  },
  { timestamps: true }
);

// Ensure one vote per user/session per suggestion
VoteSchema.index({ user: 1, suggestion: 1 }, { unique: true, sparse: true });
VoteSchema.index({ sessionId: 1, suggestion: 1 }, { unique: true, sparse: true });

const Vote = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
