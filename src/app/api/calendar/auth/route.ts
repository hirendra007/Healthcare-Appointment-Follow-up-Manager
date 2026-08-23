import { NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar.service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctorId');

  if (!doctorId) {
    return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
  }

  const url = CalendarService.getAuthUrl(doctorId);
  return NextResponse.redirect(url);
}
