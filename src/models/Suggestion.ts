import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IApplication } from './Application';

export interface ISuggestion extends Document {
  _id: string;
  title: string;
  description: string;
  category: { name: string; color: string };
  comments?: { user: IUser; text: string; createdAt: Date }[];
  voteCount: number;
  files?: {
    originalName: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  applicationId: IApplication;
  userId: IUser | null; // Allow anonymous submissions
}

const SuggestionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      name: { type: String, required: true },
      color: { type: String, required: true },
    },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    voteCount: { type: Number, default: 0 },
    files: [
      {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        mimetype: { type: String },
        size: { type: Number },
      },
    ],
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Allow anonymous submissions
  },
  { timestamps: true }
);

const Suggestion = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

export default Suggestion;
