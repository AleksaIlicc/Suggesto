import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IApplication extends Document {
  _id: string;
  name: string;
  description: string;
  suggestions?: {
    _id: string;
    title: string;
    description: string;
    count: number;
    voteCount?: number;
  }[];
  design: {
    headerColor: string;
    buttonColor: string;
    backgroundColor: string;
    logo?: string;
  };
  user: IUser;
  lastOpened?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    suggestions: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Suggestion' },
        title: { type: String },
        description: { type: String },
        count: { type: Number },
        voteCount: { type: Number, default: 0 },
      },
    ],
    design: {
      headerColor: { type: String, required: true, default: '#374151' },
      buttonColor: { type: String, required: true, default: '#111827' },
      backgroundColor: { type: String, required: true, default: '#F3F4F6' },
      logo: { type: String, default: '' },
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastOpened: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Application = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);

export default Application;
