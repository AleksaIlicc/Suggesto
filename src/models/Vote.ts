import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { ISuggestion } from './Suggestion';

export interface IVote extends Document {
  _id: string;
  user?: IUser;
  sessionId?: string;
  suggestion: ISuggestion;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    sessionId: { type: String, required: false },
    suggestion: {
      type: Schema.Types.ObjectId,
      ref: 'Suggestion',
      required: true,
    },
  },
  { timestamps: true }
);

const Vote = mongoose.model<IVote>('Vote', VoteSchema);

export default Vote;
