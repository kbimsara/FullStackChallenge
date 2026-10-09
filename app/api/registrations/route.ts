import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { registerAttendee, ConcurrencyError } from '@/services/registrationService';
import { Permissions, hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import { Registration } from '@/models/Registration';

const registrationSchema = z.object({
  workshopId: z.string().min(1),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_VIEW_REGISTRATIONS)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToDatabase();
  const url = new URL(req.url);
  const workshopId = url.searchParams.get('workshopId');
  
  const query: any = {};
  if (workshopId) {
    query.workshopId = workshopId;
  }

  const registrations = await Registration.find(query).sort({ createdAt: -1 });
  return NextResponse.json(registrations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_REGISTER_ATTENDEE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = registrationSchema.parse(body);
    
    const registration = await registerAttendee(data.workshopId, data.attendeeName, data.attendeeEmail, session.user.id);
    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    if (error instanceof ConcurrencyError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
