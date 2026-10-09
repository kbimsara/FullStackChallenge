import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Permissions, hasPermission } from '@/lib/permissions';
import { User } from '@/models/User';
import connectToDatabase from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/services/auditService';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['MANAGER', 'STAFF']),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_MANAGE_USERS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const users = await User.find().select('-passwordHash');
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_MANAGE_USERS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = userSchema.parse(body);

    await connectToDatabase();

    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
    });

    await user.save();

    await logAudit(
      session.user.id,
      'CREATE_USER',
      'User',
      user._id,
      `Created user ${user.email} with role ${user.role}`
    );

    const userObj = user.toObject() as any;
    delete userObj.passwordHash;
    return NextResponse.json(userObj, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
