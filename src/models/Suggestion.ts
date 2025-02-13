import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IApplication } from './Application';

export interface ISuggestion extends Document {
  _id: string;
  title: string;
  description: string;
  categories: {
    name: string;
    color: string;
  }[];
  comments?: {
    user: IUser;
    text: string;
    createdAt: Date;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  applicationId: IApplication;
  userId: IUser;
}

const SuggestionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    categories: [
      {
        name: {
          type: String,
          required: true,
          enum: ['bug', 'feature', 'improvement', 'design', 'other'],
        },
        color: { type: String, required: true },
      },
    ],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Suggestion = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

export default Suggestion;
