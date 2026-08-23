import { NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar.service';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: Request) {
  // const session = await getServerSession();
  // if (!session || session.user.role !== 'DOCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // For the assignment we might use a hardcoded state or doctorId, let's just grab the code.

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // In a real app, pass doctorId in state

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    const doctorId = state;
    const tokens = await CalendarService.getTokensFromCode(code);

    await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { googleCalendarTokens: tokens as any },
    });

    return NextResponse.redirect(new URL('/doctor?calendarSync=success', req.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
