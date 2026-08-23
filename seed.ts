import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  let patient = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
  if (!patient) {
    patient = await prisma.user.create({
      data: {
        name: 'Test Patient',
        email: 'patient@example.com',
        passwordHash: 'hashedpassword',
        role: 'PATIENT',
      }
    });
  }

  let doctorUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  if (!doctorUser) {
    doctorUser = await prisma.user.create({
      data: {
        name: 'Dr. Smith',
        email: 'doctor@example.com',
        passwordHash: 'hashedpassword',
        role: 'DOCTOR',
      }
    });
  }

  let doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUser.id } });
  if (!doctorProfile) {
    doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        specialisation: 'General Practice',
        workingHours: {
          "monday": { "start": "09:00", "end": "17:00" },
          "tuesday": { "start": "09:00", "end": "17:00" },
          "wednesday": { "start": "09:00", "end": "17:00" },
          "thursday": { "start": "09:00", "end": "17:00" },
          "friday": { "start": "09:00", "end": "17:00" }
        },
        slotDurationMinutes: 30
      }
    });
  }

  console.log(`DOCTOR_ID=${doctorProfile.id}`);
  console.log(`PATIENT_ID=${patient.id}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
