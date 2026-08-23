import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/services/notification.service';
import { addHours, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (
    process.env.CRON_SECRET &&
    req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Look for appointments happening in the next 24 hours that haven't had a reminder sent
    const upcomingTime = addHours(now, 24);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        startTime: {
          gt: now,
          lte: upcomingTime,
        },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    for (const app of upcomingAppointments) {
      // Basic check: we don't track reminder sent status on the appointment itself directly 
      // in this simplified model, but in a real app we'd have a boolean flag or rely on NotificationLog.
      // For demonstration, we assume this cron runs exactly once per appointment window or we check NotificationLog.
      
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          type: 'REMINDER',
          payload: { equals: { appointmentId: app.id } },
          status: 'SENT',
        },
      });

      if (!alreadySent) {
        const subject = 'Upcoming Appointment Reminder';
        const html = `<p>This is a reminder for your upcoming appointment on ${format(app.startTime, 'PPP p')}.</p>`;
        
        // Both patient and doctor get reminded
        await NotificationService.sendEmail(app.patient.email, 'REMINDER', subject, html, { appointmentId: app.id });
        await NotificationService.sendEmail(app.doctor.user.email, 'REMINDER', subject, html, { appointmentId: app.id });
      }
    }

    return NextResponse.json({ processedCount: upcomingAppointments.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
