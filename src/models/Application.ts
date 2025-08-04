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
    suggestionsHeaderColor: string;
    suggestionTextColor: string;
    suggestionCardBgColor: string;
    voteButtonBgColor: string;
    voteButtonTextColor: string;
    suggestionMetaColor: string;
    logo?: string;
  };
  customCategories: { name: string; color: string }[];
  defaultCategoriesEnabled: boolean;
  // Privacy and access control settings
  isPublic: boolean;
  allowAnonymousVotes: boolean;
  allowPublicSubmissions: boolean;
  // Roadmap settings
  enablePublicRoadmap: boolean;
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
      suggestionsHeaderColor: {
        type: String,
        required: true,
        default: '#111827',
      },
      suggestionTextColor: { type: String, required: true, default: '#374151' },
      suggestionCardBgColor: {
        type: String,
        required: true,
        default: '#F9FAFB',
      },
      voteButtonBgColor: { type: String, required: true, default: '#E5E7EB' },
      voteButtonTextColor: { type: String, required: true, default: '#374151' },
      suggestionMetaColor: { type: String, required: true, default: '#6B7280' },
      logo: { type: String, default: '' },
    },
    customCategories: [
      {
        name: { type: String, required: true },
        color: { type: String, required: true },
      },
    ],
    defaultCategoriesEnabled: { type: Boolean, default: true },
    // Privacy and access control settings
    isPublic: { type: Boolean, default: true },
    allowAnonymousVotes: { type: Boolean, default: true },
    allowPublicSubmissions: { type: Boolean, default: true },
    // Roadmap settings
    enablePublicRoadmap: { type: Boolean, default: false },
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
