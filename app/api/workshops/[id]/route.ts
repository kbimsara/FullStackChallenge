import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateWorkshop } from '@/services/workshopService';
import { Permissions, hasPermission } from '@/lib/permissions';
import { Workshop } from '@/models/Workshop';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_VIEW_WORKSHOPS)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const workshop = await Workshop.findById(params.id);
  if (!workshop) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(workshop);
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user?.role, Permissions.CAN_EDIT_WORKSHOP)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    
    const workshop = await updateWorkshop(params.id, data as any, session.user.id);
    return NextResponse.json(workshop);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
