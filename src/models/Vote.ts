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
    suggestion: {
      type: Schema.Types.ObjectId,
      ref: 'Suggestion',
      required: true,
    },
  },
  { timestamps: true }
);

// Create a compound index that handles both authenticated and anonymous votes
// For authenticated users: user + suggestion must be unique
// For anonymous users: sessionId + suggestion must be unique
VoteSchema.index(
  { user: 1, suggestion: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true, $ne: null } },
  }
);
VoteSchema.index(
  { sessionId: 1, suggestion: 1 },
  {
    unique: true,
    partialFilterExpression: { sessionId: { $exists: true, $ne: null } },
  }
);

const Vote = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
