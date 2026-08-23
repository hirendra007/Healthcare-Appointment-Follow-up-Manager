# 🏥 Healthcare Appointment & Follow-up Manager

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

An enterprise-grade, full-stack web application built for clinical environments. Features include robust appointment scheduling, double-booking prevention, LLM-powered (Google Gemini) clinical summarization, automated prescription/medication scheduling, and Google Calendar synchronization.

---

## 📑 Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Prerequisites](#3-prerequisites)
- [4. Environment Variables](#4-environment-variables)
- [5. Database Setup & Prisma Migrations](#5-database-setup--prisma-migrations)
- [6. Local Development](#6-local-development)
- [7. API Documentation](#7-api-documentation)
- [8. LLM Integration](#8-llm-integration)
- [9. Google Calendar Integration](#9-google-calendar-oauth-20-setup)
- [10. Background Jobs](#10-background-jobs-cron)
- [11. Production Deployment](#11-production-deployment)

---

## 1. Project Overview
This system provides dedicated, secure portals for three types of users:

- 🧑‍⚕️ **Patients**: Search for doctors by specialization, book appointments (with a robust 5-minute checkout hold), and view AI-generated friendly summaries and medication schedules.
- 👨‍⚕️ **Doctors**: View daily schedules via the Command Center, get AI-generated pre-visit briefings based on patient symptoms, and submit post-consultation clinical notes/prescriptions.
- 🛡️ **Admins**: Manage clinic operations, onboard new doctors, and seamlessly manage doctor leaves (which auto-cancel affected bookings and notify patients).

## 2. Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Prisma (v7+)
- **Styling**: Tailwind CSS (Premium UI, custom SVG icons, glassmorphism)
- **AI**: Google Gemini API (`@google/genai`)
- **Calendar**: Google Calendar API (OAuth 2.0)
- **Emails**: Nodemailer (SMTP)
- **Cron Jobs**: Vercel Cron

## 3. Prerequisites
- **Node.js**: 18.x or later
- **Database**: A [Neon Database](https://neon.tech) account
- **Google Cloud**: A Google Cloud Console project (for Gemini and Calendar OAuth)
- **Email**: An SMTP server (e.g., Gmail App Password, AWS SES, or SendGrid)

## 4. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials.

```env
# Database Config
DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require"

# NextAuth Config
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Integrations
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/calendar/callback"

# Email Configuration
EMAIL_FROM="noreply@clinic.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Security
CRON_SECRET="your-cron-auth-secret"
```

## 5. Database Setup & Prisma Migrations
Since this uses Prisma 7, the `url` is configured via `prisma.config.ts`.
1. Ensure your `DIRECT_URL` is set in `.env`.
2. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Generate the Prisma Client (if not already done):
   ```bash
   npx prisma generate
   ```
4. Seed the database with mock test users (Optional but recommended):
   ```bash
   npx ts-node seed.ts
   ```

## 6. Local Development
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 7. API Documentation
The backend exposes the following key REST routes:
- `GET /api/slots?doctorId=X&date=Y`: Returns available time slots for a specific doctor.
- `POST /api/slots`: Creates a temporary 5-minute `SlotHold` to prevent double-booking.
- `POST /api/appointments`: Finalizes booking using a `holdId` and raw patient symptoms.
- `PATCH /api/appointments/:id`: Reschedules an appointment and updates the Google Calendar event.
- `DELETE /api/appointments/:id`: Cancels an appointment, deletes the calendar event, and notifies both parties via email.
- `POST /api/admin/leaves`: Marks a doctor on leave and resolves scheduling conflicts.
- `POST /api/consultations`: Submits doctor notes and generates AI summaries/prescriptions.

## 8. LLM Integration
We use `@google/genai` with strict JSON schema outputs.

- **Pre-Visit Prompt:**
  > *"Analyse these symptoms and return the urgency level, chief complaint, and exactly 3 suggested questions for the doctor. Symptoms: `<symptoms>`"*

- **Post-Visit Prompt:**
  > *"Convert these clinical notes into a patient-friendly summary, extracting any medication schedule and follow-up steps. Notes: `<clinicalNotes>`"*

**Failure Handling**: If Gemini fails, the system safely falls back, setting the `llmStatus` to `FALLBACK_ERROR`, storing the raw input, and ensuring the appointment/consultation workflow continues uninterrupted.

## 9. Google Calendar OAuth 2.0 Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API**.
3. Configure the **OAuth Consent Screen** (add `https://www.googleapis.com/auth/calendar.events` scope).
4. Create **OAuth 2.0 Client IDs** (Web Application).
5. Add `http://localhost:3000/api/calendar/callback` as an Authorized Redirect URI.
6. Copy the Client ID and Secret to your `.env` file.

## 10. Background Jobs (Cron)
Configure Vercel Cron by adding `vercel.json` to the root directory:
```json
{
  "crons": [
    { "path": "/api/cron/appointment-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/medication-reminders", "schedule": "0 10 * * *" }
  ]
}
```
> [!NOTE]
> Vercel's free Hobby tier restricts projects to a maximum of **2 cron jobs** that can only be scheduled to run **once per day**. If you upgrade to Vercel Pro, you can re-enable higher frequency cron jobs (e.g. running every 15 minutes for immediate notification retries and booking hold cleanup).

## 11. Production Deployment
Ready to deploy to **Vercel**:
1. Push the code to GitHub.
2. Import the repository in Vercel.
3. Add all Environment Variables in the Vercel dashboard.
4. Deploy. Vercel automatically configures the cron jobs via `vercel.json` and runs `prisma generate` during the build phase.