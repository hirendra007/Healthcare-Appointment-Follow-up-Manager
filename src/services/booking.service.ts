import prisma from '@/lib/prisma';
import { addMinutes, isBefore, isWithinInterval, parse, setDay, format } from 'date-fns';
import { CalendarService } from './calendar.service';
import { NotificationService } from './notification.service';
import { GeminiService } from './gemini.service';
import { UrgencyLevel } from '@prisma/client';

export class BookingService {
  /**
   * Generates available slots for a doctor on a specific date.
   * Takes into account working hours, existing appointments, doctor leaves, and active slot holds.
   */
  static async getAvailableSlots(doctorId: string, date: Date) {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) throw new Error('Doctor not found');

    // 1. Check if doctor is on leave on this date
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        doctorId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (leaves.length > 0) return []; // Doctor is on leave

    // 2. Parse working hours for the specific day of the week
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    const workingHours = (doctor.workingHours as any)?.[dayOfWeek];

    if (!workingHours || !workingHours.start || !workingHours.end) {
      return []; // Not working on this day
    }

    const startTime = parse(workingHours.start, 'HH:mm', date);
    const endTime = parse(workingHours.end, 'HH:mm', date);

    // 3. Get existing appointments and holds
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
    });

    const activeHolds = await prisma.slotHold.findMany({
      where: {
        doctorId,
        expiresAt: { gt: new Date() },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 4. Generate slots
    const slots = [];
    let currentSlotStart = startTime;

    while (isBefore(currentSlotStart, endTime)) {
      const currentSlotEnd = addMinutes(currentSlotStart, doctor.slotDurationMinutes);

      // Check for overlap with appointments
      const isBooked = existingAppointments.some(
        (app) =>
          isWithinInterval(currentSlotStart, { start: app.startTime, end: app.endTime }) ||
          (app.startTime <= currentSlotStart && app.endTime > currentSlotStart)
      );

      // Check for overlap with active holds
      const isHeld = activeHolds.some(
        (hold) =>
          isWithinInterval(currentSlotStart, { start: hold.startTime, end: hold.endTime }) ||
          (hold.startTime <= currentSlotStart && hold.endTime > currentSlotStart)
      );

      if (!isBooked && !isHeld) {
        slots.push({
          start: currentSlotStart,
          end: currentSlotEnd,
        });
      }

      currentSlotStart = currentSlotEnd;
    }

    return slots;
  }

  /**
   * Holds a slot for a patient for 5 minutes during the checkout/symptom submission process.
   */
  static async holdSlot(doctorId: string, patientId: string, startTime: Date, endTime: Date) {
    // Clean up expired holds first to free up slots
    await prisma.slotHold.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Check if the slot is already booked
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId,
          startTime,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingAppointment) {
        throw new Error('Slot is already booked.');
      }

      // 2. Check if the slot is already held
      const existingHold = await tx.slotHold.findFirst({
        where: {
          doctorId,
          startTime,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingHold) {
        throw new Error('Slot is currently held by another user.');
      }

      // 3. Create the hold (expires in 5 minutes)
      const expiresAt = addMinutes(new Date(), 5);
      const hold = await tx.slotHold.create({
        data: {
          doctorId,
          patientId,
          startTime,
          endTime,
          expiresAt,
        },
      });

      return hold;
    });
  }

  /**
   * Books the appointment, consumes the hold, handles symptoms + AI, and creates calendar event.
   */
  static async bookAppointment(
    holdId: string,
    rawSymptoms: string
  ) {
    // 1. Transaction for critical booking logic
    const appointment = await prisma.$transaction(async (tx) => {
      const hold = await tx.slotHold.findUnique({
        where: { id: holdId },
        include: { patient: true, doctor: { include: { user: true } } },
      });

      if (!hold) throw new Error('Slot hold not found.');
      if (isBefore(hold.expiresAt, new Date())) {
        throw new Error('Slot hold expired. Please try again.');
      }

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId: hold.doctorId,
          startTime: hold.startTime,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingAppointment) throw new Error('Slot is already booked.');

      const newAppointment = await tx.appointment.create({
        data: {
          doctorId: hold.doctorId,
          patientId: hold.patientId,
          startTime: hold.startTime,
          endTime: hold.endTime,
          status: 'CONFIRMED',
        },
        include: {
          patient: true,
          doctor: { include: { user: true } },
        }
      });

      await tx.slotHold.delete({ where: { id: holdId } });

      return newAppointment;
    });

    // 2. Fire off Gemini pre-visit summary OUTSIDE the transaction
    // This prevents slow AI API calls from keeping the database lock open and timing out.
    try {
      const aiResult = await GeminiService.generatePreVisitSummary(rawSymptoms);
      
      await prisma.symptomSubmission.create({
        data: {
          appointmentId: appointment.id,
          rawSymptoms,
          urgencyLevel: aiResult.success ? (aiResult.data?.urgencyLevel as UrgencyLevel) : 'LOW',
          chiefComplaint: aiResult.success ? aiResult.data?.chiefComplaint! : 'AI Summarization Failed',
          suggestedQuestions: aiResult.success ? aiResult.data?.suggestedQuestions! : [],
          llmStatus: aiResult.success ? 'SUCCESS' : 'FALLBACK_ERROR',
        },
      });
    } catch (error) {
      // If something throws entirely, log it and fall back
      console.error('Failed to generate pre-visit summary:', error);
      await prisma.symptomSubmission.create({
        data: {
          appointmentId: appointment.id,
          rawSymptoms,
          urgencyLevel: 'LOW',
          chiefComplaint: 'AI Summarization Failed',
          suggestedQuestions: [],
          llmStatus: 'FALLBACK_ERROR',
        },
      });
    }

    return appointment;
  }

  /**
   * Post-transaction hooks (Calendar + Email)
   * This ensures slow external APIs don't hold database locks.
   */
  static async handlePostBooking(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) return;

    // 1. Google Calendar
    if (appointment.doctor.googleCalendarTokens) {
      const eventId = await CalendarService.createEvent(
        appointment.doctor.googleCalendarTokens,
        {
          summary: `Consultation: ${appointment.patient.name}`,
          description: `Appointment with ${appointment.patient.name}.`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          attendees: [appointment.patient.email, appointment.doctor.user.email],
        }
      );

      if (eventId) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: eventId },
        });
      }
    }

    // 2. Send Emails
    const subject = 'Appointment Confirmed';
    const html = `<p>Your appointment on ${format(appointment.startTime, 'PPP p')} is confirmed.</p>`;
    
    await NotificationService.sendEmail(appointment.patient.email, 'BOOKING_CONFIRMATION', subject, html);
    await NotificationService.sendEmail(appointment.doctor.user.email, 'BOOKING_CONFIRMATION', subject, html);
  }
}
