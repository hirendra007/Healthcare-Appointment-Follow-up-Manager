import { NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (
    process.env.CRON_SECRET &&
    req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await NotificationService.retryFailedNotifications();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
