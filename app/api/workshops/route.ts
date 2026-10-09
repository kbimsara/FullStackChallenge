import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Workshop } from '@/models/Workshop';
import { createWorkshop } from '@/services/workshopService';
import { Permissions, hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const workshopSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  instructor: z.string().min(1),
  location: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_VIEW_WORKSHOPS)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  
  const query: any = {};
  if (status) {
    query.status = status;
  }
  
  const workshops = await Workshop.find(query).sort({ startAt: 1 });
  return NextResponse.json(workshops);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_CREATE_WORKSHOP)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = workshopSchema.parse(body);
    
    const workshop = await createWorkshop(data as any, session.user.id);
    return NextResponse.json(workshop, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    // Handle mongoose duplicate code error
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Workshop code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
