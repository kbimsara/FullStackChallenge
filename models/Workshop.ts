import mongoose, { Schema, Document, Model } from 'mongoose';

export enum WorkshopStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IWorkshop extends Document {
  code: string;
  title: string;
  description: string;
  instructor: string;
  location: string;
  startAt: Date;
  endAt?: Date;
  capacity: number;
  registeredCount: number;
  status: WorkshopStatus;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopSchema: Schema<IWorkshop> = new Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: String, required: true },
    location: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(WorkshopStatus),
      default: WorkshopStatus.SCHEDULED,
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

WorkshopSchema.index({ code: 1 }, { unique: true });
WorkshopSchema.index({ startAt: 1 });
WorkshopSchema.index({ status: 1 });

export const Workshop: Model<IWorkshop> =
  mongoose.models.Workshop || mongoose.model<IWorkshop>('Workshop', WorkshopSchema);
