import mongoose, { Document, Schema } from 'mongoose';
import { IApplication } from './Application';
import { ISuggestion } from './Suggestion';

export interface IRoadmapItem extends Document {
  _id: string;
  applicationId: IApplication;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  type?: 'feature' | 'improvement' | 'bug-fix' | 'announcement';
  suggestion?: ISuggestion;
  estimatedReleaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapItemSchema: Schema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      required: true,
      default: 'planned',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    type: {
      type: String,
      enum: ['feature', 'improvement', 'bug-fix', 'announcement'],
    },
    suggestion: {
      type: Schema.Types.ObjectId,
      ref: 'Suggestion',
      required: false,
    },
    estimatedReleaseDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
RoadmapItemSchema.index({
  applicationId: 1,
  status: 1,
  estimatedReleaseDate: 1,
});
RoadmapItemSchema.index({ applicationId: 1, createdAt: -1 });

const RoadmapItem = mongoose.model<IRoadmapItem>(
  'RoadmapItem',
  RoadmapItemSchema
);

export default RoadmapItem;
