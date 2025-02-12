import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  description: string;
  suggestions?: { title: string; description: string }[];
  headerColor?: string;
  buttonColor?: string;
}

const ApplicationSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  suggestions: [
    {
      title: { type: String },
      description: { type: String },
    },
  ],
  headerColor: { type: String },
  buttonColor: { type: String },
});

const Application = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);

export default Application;
