import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CalendarService } from '@/services/calendar.service';
import { NotificationService } from '@/services/notification.service';
import { format } from 'date-fns';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { startTime, endTime } = body;

    // A real implementation would verify double booking on reschedule here
    // Similar to BookingService logic.

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (appointment.googleEventId && appointment.doctor.googleCalendarTokens) {
      await CalendarService.updateEvent(
        appointment.doctor.googleCalendarTokens,
        appointment.googleEventId,
        {
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (appointment.googleEventId && appointment.doctor.googleCalendarTokens) {
      await CalendarService.deleteEvent(
        appointment.doctor.googleCalendarTokens,
        appointment.googleEventId
      );
    }

    // Send Cancellation Notifications
    const subject = 'Appointment Cancelled';
    const html = `<p>The appointment on ${format(
      appointment.startTime,
      'PPP p'
    )} has been cancelled.</p>`;

    await NotificationService.sendEmail(appointment.patient.email, 'CANCELLATION', subject, html);
    await NotificationService.sendEmail(appointment.doctor.user.email, 'CANCELLATION', subject, html);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
