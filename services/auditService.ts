import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

export async function logAudit(
  actorId: string | mongoose.Types.ObjectId,
  action: string,
  entityType: string,
  entityId: string | mongoose.Types.ObjectId,
  summary: string,
  session?: mongoose.mongo.ClientSession
) {
  const log = new AuditLog({
    actorId,
    action,
    entityType,
    entityId,
    summary,
  });

  if (session) {
    await log.save({ session });
  } else {
    await log.save();
  }
}
