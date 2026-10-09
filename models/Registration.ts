import mongoose, { Schema, Document, Model } from 'mongoose';

export enum RegistrationStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export interface IRegistration extends Document {
  workshopId: mongoose.Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  status: RegistrationStatus;
  registeredBy: mongoose.Types.ObjectId;
  registeredAt: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema: Schema<IRegistration> = new Schema(
  {
    workshopId: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true, index: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.ACTIVE,
      required: true,
    },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, required: true, default: Date.now },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

RegistrationSchema.index({ workshopId: 1, status: 1 });

export const Registration: Model<IRegistration> =
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);
