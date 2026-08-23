import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, password, specialisation } = await req.json();

    if (!name || !email || !password || !specialisation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialisation,
            workingHours: {
              "monday": { "start": "09:00", "end": "17:00" },
              "tuesday": { "start": "09:00", "end": "17:00" },
              "wednesday": { "start": "09:00", "end": "17:00" },
              "thursday": { "start": "09:00", "end": "17:00" },
              "friday": { "start": "09:00", "end": "17:00" }
            },
            slotDurationMinutes: 30
          }
        }
      },
      include: { doctorProfile: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
