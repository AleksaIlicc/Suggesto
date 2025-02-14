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
  }[];
  design?: {
    headerColor?: string;
    buttonColor?: string;
    backgroundColor?: string;
  };
  userId: IUser;
}

const ApplicationSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  suggestions: [
    {
      _id: { type: Schema.Types.ObjectId, ref: 'Suggestion' },
      title: { type: String },
      description: { type: String },
      count: { type: Number },
    },
  ],
  design: {
    headerColor: { type: String },
    buttonColor: { type: String },
    backgroundColor: { type: String },
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const Application = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);

export default Application;
