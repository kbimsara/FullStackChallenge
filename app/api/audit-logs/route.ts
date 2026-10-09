import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Permissions, hasPermission } from '@/lib/permissions';
import { AuditLog } from '@/models/AuditLog';
import connectToDatabase from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_VIEW_AUDIT_LOGS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).populate('actorId', 'name email role');
  return NextResponse.json(logs);
}
