import { NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { holdId, rawSymptoms } = body;

    if (!holdId || !rawSymptoms) {
      return NextResponse.json({ error: 'holdId and rawSymptoms are required' }, { status: 400 });
    }

    // 1. Book the appointment within a transaction
    const appointment = await BookingService.bookAppointment(holdId, rawSymptoms);

    // 2. Fire post-booking tasks (Calendar, Email) asynchronously so we don't block the response
    // In serverless, we might need to await this or use a background job/worker, 
    // but Next.js App Router allows doing this if we don't return immediately, or we can just await it.
    await BookingService.handlePostBooking(appointment.id);

    return NextResponse.json({ appointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
