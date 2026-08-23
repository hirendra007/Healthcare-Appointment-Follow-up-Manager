import prisma from '@/lib/prisma';
import { GeminiService } from './gemini.service';
import { addDays, addHours, set } from 'date-fns';

export class ConsultationService {
  /**
   * Submits post-visit clinical notes and creates prescriptions.
   * Leverages Gemini to generate a patient-friendly summary and extracts medication schedules.
   */
  static async submitConsultation(
    appointmentId: string,
    clinicalNotes: string,
    prescriptions: { medicationName: string; dosage: string; frequency: string; duration: string; instructions: string }[]
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment) throw new Error('Appointment not found');

    // 1. Generate Patient-Friendly Summary via Gemini
    const aiResult = await GeminiService.generatePostVisitSummary(clinicalNotes);

    return await prisma.$transaction(async (tx) => {
      // 2. Create Consultation Note
      const note = await tx.consultationNote.create({
        data: {
          appointmentId,
          clinicalNotes,
          patientSummary: aiResult.success ? aiResult.data?.patientSummary! : 'AI Summarization Failed.',
          followUpSteps: aiResult.success ? aiResult.data?.followUpSteps! : [],
          llmStatus: aiResult.success ? 'SUCCESS' : 'FALLBACK_ERROR',
        },
      });

      // 3. Create Prescription if any medications exist
      if (prescriptions && prescriptions.length > 0) {
        const prescriptionRecord = await tx.prescription.create({
          data: {
            appointmentId,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            items: {
              create: prescriptions,
            },
          },
          include: { items: true },
        });

        // 4. Derive Medication Reminders based on frequency
        // For simplicity, we just generate a single daily reminder for the duration for this demo.
        // A robust system would parse "Twice a day", "Every 8 hours", etc.
        const reminders = [];
        for (const item of prescriptionRecord.items) {
          const days = parseInt(item.duration) || 7; // default 7 days if parsing fails
          
          for (let i = 1; i <= days; i++) {
            const scheduledTime = set(addDays(new Date(), i), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }); // 9 AM daily
            
            reminders.push({
              prescriptionId: prescriptionRecord.id,
              patientId: appointment.patientId,
              medicationName: item.medicationName,
              dosage: item.dosage,
              frequency: item.frequency,
              scheduledTime,
              status: 'PENDING' as any,
            });
          }
        }

        if (reminders.length > 0) {
          await tx.medicationReminder.createMany({
            data: reminders,
          });
        }
      }

      // Mark appointment as COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      return note;
    });
  }
}
