import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/services/notification.service';

// Required for Vercel Cron
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Verify Cron Secret if set
  if (
    process.env.CRON_SECRET &&
    req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find pending reminders that are due
    const dueReminders = await prisma.medicationReminder.findMany({
      where: {
        status: 'PENDING',
        scheduledTime: { lte: now },
      },
      include: { patient: true },
      take: 50, // Batch limit
    });

    for (const reminder of dueReminders) {
      const subject = `Medication Reminder: ${reminder.medicationName}`;
      const html = `
        <p>Hi ${reminder.patient.name},</p>
        <p>This is a reminder to take your medication:</p>
        <ul>
          <li><strong>Medication:</strong> ${reminder.medicationName}</li>
          <li><strong>Dosage:</strong> ${reminder.dosage}</li>
        </ul>
      `;

      await NotificationService.sendEmail(reminder.patient.email, 'REMINDER', subject, html);

      // Mark as SENT
      await prisma.medicationReminder.update({
        where: { id: reminder.id },
        data: { status: 'SENT' },
      });
    }

    return NextResponse.json({ processedCount: dueReminders.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
