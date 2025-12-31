
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplateAuthor {
  name: string;
  profileUrl?: string;
}

export interface IDatabaseConfig {
  databaseName: string;
  logo: string;
  prompt: string;
}

export interface ITemplate extends Document {
  name: string;
  slug: string;
  category: string;
  tags: string[];
  author: ITemplateAuthor;
  thumbnailUrl: string;
  demoGifUrl: string;
  cli: string;
  aiPrompt: string;
  databaseConfigurations?: IDatabaseConfig[];
  npmPackageUrl: string;
  version: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: {
      name: { type: String, required: true },
      profileUrl: { type: String, default: '' },
    },
    thumbnailUrl: { type: String, default: '' },
    demoGifUrl: { type: String, default: '' },
    cli: { type: String, default: '' },
    aiPrompt: { type: String, default: '' },
    databaseConfigurations: [
      {
        databaseName: { type: String },
        logo: { type: String },
        prompt: { type: String },
      }
    ],
    npmPackageUrl: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template;
