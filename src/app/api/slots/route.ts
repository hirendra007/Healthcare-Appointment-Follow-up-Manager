import { NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctorId');
  const dateStr = searchParams.get('date'); // YYYY-MM-DD

  if (!doctorId || !dateStr) {
    return NextResponse.json({ error: 'doctorId and date are required' }, { status: 400 });
  }

  try {
    const date = new Date(dateStr);
    const slots = await BookingService.getAvailableSlots(doctorId, date);
    return NextResponse.json({ slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'PATIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { doctorId, startTime, endTime } = body;

    const hold = await BookingService.holdSlot(
      doctorId,
      (session.user as any).id,
      new Date(startTime),
      new Date(endTime)
    );

    return NextResponse.json({ hold });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
