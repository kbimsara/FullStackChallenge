import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cancelRegistration, ConcurrencyError } from '@/services/registrationService';
import { Permissions, hasPermission } from '@/lib/permissions';

export async function POST(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_CANCEL_REGISTRATION)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const registration = await cancelRegistration(params.id, session.user.id);
    return NextResponse.json(registration);
  } catch (error: any) {
    if (error instanceof ConcurrencyError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
