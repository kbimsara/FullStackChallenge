import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import { Workshop, WorkshopStatus, IWorkshop } from '@/models/Workshop';
import { logAudit } from './auditService';

export async function createWorkshop(data: Partial<IWorkshop>, userId: string) {
  await connectToDatabase();
  
  const workshop = new Workshop({
    ...data,
    status: WorkshopStatus.SCHEDULED,
    createdBy: userId,
    updatedBy: userId,
  });

  await workshop.save();
  
  await logAudit(
    userId,
    'CREATE',
    'Workshop',
    workshop._id,
    `Created workshop with code ${workshop.code}`
  );

  return workshop;
}

export async function updateWorkshop(id: string, data: Partial<IWorkshop>, userId: string) {
  await connectToDatabase();
  
  const workshop = await Workshop.findById(id);
  if (!workshop) {
    throw new Error('Workshop not found');
  }

  // Prevent reducing capacity below current registrations
  if (data.capacity !== undefined && data.capacity < workshop.registeredCount) {
    throw new Error('Capacity cannot be reduced below current registered count');
  }

  Object.assign(workshop, { ...data, updatedBy: userId });
  await workshop.save();

  await logAudit(
    userId,
    'UPDATE',
    'Workshop',
    workshop._id,
    `Updated workshop properties`
  );

  return workshop;
}
