import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import { Workshop, WorkshopStatus } from '@/models/Workshop';
import { Registration, RegistrationStatus } from '@/models/Registration';
import { logAudit } from './auditService';

export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

export async function registerAttendee(
  workshopId: string,
  attendeeName: string,
  attendeeEmail: string,
  userId: string
) {
  await connectToDatabase();

  const session = await mongoose.startSession();
  
  try {
    let registration;
    await session.withTransaction(async () => {
      // 1. Find and update workshop capacity atomically
      const workshop = await Workshop.findOneAndUpdate(
        {
          _id: workshopId,
          status: { $in: [WorkshopStatus.SCHEDULED, WorkshopStatus.IN_PROGRESS] },
          $expr: { $lt: ['$registeredCount', '$capacity'] }
        },
        {
          $inc: { registeredCount: 1 }
        },
        { new: true, session }
      );

      if (!workshop) {
        // Workshop might be full, cancelled, or not found.
        // We'll throw an error to abort transaction
        throw new ConcurrencyError('Workshop is full, unavailable, or does not exist');
      }

      // 2. Create the registration
      const newRegistration = new Registration({
        workshopId: workshop._id,
        attendeeName,
        attendeeEmail,
        status: RegistrationStatus.ACTIVE,
        registeredBy: userId,
      });
      
      await newRegistration.save({ session });
      registration = newRegistration;

      // 3. Log audit
      await logAudit(
        userId,
        'REGISTER',
        'Registration',
        newRegistration._id,
        `Registered attendee ${attendeeEmail} to workshop ${workshop.code}`,
        session
      );
    });
    
    return registration;
  } finally {
    await session.endSession();
  }
}

export async function cancelRegistration(registrationId: string, userId: string) {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    let cancelledRegistration;
    await session.withTransaction(async () => {
      // 1. Find and update registration atomically
      const registration = await Registration.findOneAndUpdate(
        {
          _id: registrationId,
          status: RegistrationStatus.ACTIVE
        },
        {
          $set: {
            status: RegistrationStatus.CANCELLED,
            cancelledBy: userId,
            cancelledAt: new Date()
          }
        },
        { new: true, session }
      );

      if (!registration) {
        throw new ConcurrencyError('Registration is already cancelled or not found');
      }
      
      cancelledRegistration = registration;

      // 2. Decrement workshop count exactly once
      await Workshop.updateOne(
        { _id: registration.workshopId },
        { $inc: { registeredCount: -1 } },
        { session }
      );

      // 3. Log audit
      await logAudit(
        userId,
        'CANCEL_REGISTRATION',
        'Registration',
        registration._id,
        `Cancelled registration for ${registration.attendeeEmail}`,
        session
      );
    });
    
    return cancelledRegistration;
  } finally {
    await session.endSession();
  }
}
