import { Schema, model, Document } from 'mongoose';

export interface ISystemError extends Document {
  message: string;
  stack?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  userContext?: string; 
  createdAt: Date;
}

const systemErrorSchema = new Schema<ISystemError>(
  {
    message: { type: String, required: true },
    stack: { type: String },
    method: { type: String },
    url: { type: String },
    statusCode: { type: Number },
    userContext: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    capped: { size: 52428800 }, 
  }
);

export const SystemErrorModel = model<ISystemError>('SystemError', systemErrorSchema);