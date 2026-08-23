import { NextResponse } from 'next/server';
import { LeaveService } from '@/services/leave.service';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  // const session = await getServerSession();
  // if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { doctorId, startDate, endDate, reason } = body;

    const { leave, conflictingAppointments, doctor } = await LeaveService.addLeave(
      doctorId,
      new Date(startDate),
      new Date(endDate),
      reason
    );

    // Run external notifications without blocking
    await LeaveService.handlePostLeave(conflictingAppointments, doctor);

    return NextResponse.json({ leave, cancelledCount: conflictingAppointments.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
