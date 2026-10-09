import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Permissions, hasPermission } from '@/lib/permissions';
import { User } from '@/models/User';
import connectToDatabase from '@/lib/db';
import { z } from 'zod';
import { logAudit } from '@/services/auditService';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['MANAGER', 'STAFF', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_MANAGE_USERS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    await connectToDatabase();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' && data.role && data.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot change Admin role' }, { status: 403 });
    }

    Object.assign(user, data);
    await user.save();

    await logAudit(
      session.user.id,
      'UPDATE_USER',
      'User',
      user._id,
      `Updated user ${user.email} properties`
    );

    const userObj = user.toObject() as any;
    delete userObj.passwordHash;
    return NextResponse.json(userObj);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
