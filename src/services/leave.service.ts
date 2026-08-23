import prisma from '@/lib/prisma';
import { CalendarService } from './calendar.service';
import { NotificationService } from './notification.service';
import { format } from 'date-fns';

export class LeaveService {
  /**
   * Adds a leave for a doctor and handles conflict resolution.
   * Cancels any appointments that overlap with the leave period.
   */
  static async addLeave(doctorId: string, startDate: Date, endDate: Date, reason?: string) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) throw new Error('Doctor not found');

    return await prisma.$transaction(async (tx) => {
      // 1. Create the leave record
      const leave = await tx.doctorLeave.create({
        data: {
          doctorId,
          startDate,
          endDate,
          reason,
        },
      });

      // 2. Find all overlapping appointments
      const conflictingAppointments = await tx.appointment.findMany({
        where: {
          doctorId,
          status: 'CONFIRMED',
          OR: [
            {
              startTime: { gte: startDate, lte: endDate },
            },
            {
              endTime: { gte: startDate, lte: endDate },
            },
          ],
        },
        include: { patient: true },
      });

      // 3. Cancel overlapping appointments
      if (conflictingAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: { in: conflictingAppointments.map((a) => a.id) },
          },
          data: { status: 'CANCELLED' },
        });

        // 4. Release affected slots (Any holds that fall in this range are also deleted)
        await tx.slotHold.deleteMany({
          where: {
            doctorId,
            OR: [
              { startTime: { gte: startDate, lte: endDate } },
              { endTime: { gte: startDate, lte: endDate } },
            ],
          },
        });
      }

      // 5. Post-transaction tasks (Calendar and Notifications) are deferred 
      //    to avoid blocking the transaction.
      //    We can pass them out or handle them immediately after the transaction block.
      return { leave, conflictingAppointments, doctor };
    });
  }

  /**
   * Handles external API calls after leave is recorded.
   */
  static async handlePostLeave(
    conflictingAppointments: any[],
    doctor: any
  ) {
    for (const app of conflictingAppointments) {
      // 1. Delete Google Calendar Event
      if (app.googleEventId && doctor.googleCalendarTokens) {
        await CalendarService.deleteEvent(doctor.googleCalendarTokens, app.googleEventId);
      }

      // 2. Send Cancellation Notifications
      const subject = 'Appointment Cancelled - Doctor on Leave';
      const html = `<p>We apologize, but your appointment on ${format(
        app.startTime,
        'PPP p'
      )} has been cancelled because the doctor is on leave.</p>`;

      await NotificationService.sendEmail(app.patient.email, 'CANCELLATION', subject, html);
      await NotificationService.sendEmail(doctor.user.email, 'CANCELLATION', subject, html);
    }
  }
}
