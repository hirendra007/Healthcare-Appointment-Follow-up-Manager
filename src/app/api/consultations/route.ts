import { NextResponse } from 'next/server';
import { ConsultationService } from '@/services/consultation.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, clinicalNotes, prescriptions } = body;

    if (!appointmentId || !clinicalNotes) {
      return NextResponse.json({ error: 'appointmentId and clinicalNotes are required' }, { status: 400 });
    }

    const note = await ConsultationService.submitConsultation(appointmentId, clinicalNotes, prescriptions);

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
