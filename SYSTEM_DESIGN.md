# System Design: Healthcare Appointment Manager

## 1. Architecture Overview
The system is built on Next.js 14 (App Router) using a Serverless PostgreSQL database (Neon) via Prisma ORM. The architecture follows a multi-tier pattern where API route handlers delegate core business logic to dedicated, stateless service classes (`BookingService`, `LeaveService`, `GeminiService`, `NotificationService`). This isolates external integrations (Google Calendar, SMTP, Gemini) from the controller layer, ensuring maintainability and robust error handling. Background tasks (Cron) are decoupled from user interactions, enhancing reliability for scheduled reminders and email retries.

## 2. Double-Booking Prevention
Preventing double-booking is critical in clinical scheduling. This is handled at the database level using `prisma.$transaction`. 

When a user confirms a booking:
1. An explicit isolation transaction begins.
2. The system checks `Appointment` records for any existing CONFIRMED booking for the exact `doctorId` and `startTime`.
3. If an overlapping record exists, the transaction aborts with an exception.
4. If no conflict exists, the appointment is created and committed atomically.

This ACID-compliant transaction guarantees that concurrent booking requests for the same slot serialize sequentially. Only the first request will read a "free" slot and succeed, while subsequent concurrent requests will detect the new record (or block until the first commits) and fail safely.

## 3. Slot Hold Mechanism
To prevent frustration during the symptom intake phase, slots are temporarily "held" while a patient fills out the booking form.
- **Holding**: When a user selects a time, `BookingService.holdSlot()` creates a `SlotHold` record expiring in 5 minutes. This operates within a transaction that first verifies no existing appointments *or* active holds exist for that slot.
- **Enforcement**: The slot computation logic (`getAvailableSlots`) filters out slots that intersect with active `SlotHold` records where `expiresAt > now()`.
- **Consumption/Cleanup**: Upon final booking, the `holdId` is verified. If the hold has expired, the booking fails. If valid, the appointment is created and the `SlotHold` is immediately deleted in the same transaction. A dedicated Cron job (`/api/cron/cleanup-holds`) periodically purges expired holds to prevent database bloat.

## 4. Doctor Leave Conflict Handling
When an admin marks a doctor as on leave for specific dates, the `LeaveService` executes a comprehensive conflict resolution workflow:
1. A transaction creates the `DoctorLeave` record.
2. It queries all `CONFIRMED` appointments that intersect with the leave's `startDate` and `endDate`.
3. It updates those specific appointments to `CANCELLED` and drops any overlapping `SlotHold`s.
4. Once the database state is safely committed, a post-transaction loop iterates over the affected appointments.
5. For each cancellation, it asynchronously invokes the `CalendarService` to delete the Google Calendar event and the `NotificationService` to email both the patient and doctor.

By keeping the third-party network calls outside the database transaction, we ensure the database does not hold long locks while waiting for Google or the email provider to respond.

## 5. Notification Failure Handling
Clinical communications are critical; therefore, the system implements a persistent outbox pattern for emails.
- **Logging**: Before dispatching an email, `NotificationService` creates a `NotificationLog` record with status `PENDING`.
- **Dispatching**: The system attempts to send the email via the SMTP provider (Nodemailer). If successful, the log is updated to `SENT`.
- **Failure State**: If the provider API fails (e.g., rate limits, network error), the exception is caught, the email is dropped from the synchronous flow, and the log is updated to `FAILED`. This prevents a third-party email outage from breaking the appointment booking transaction.
- **Retries**: A background cron job (`/api/cron/notification-retries`) periodically polls for `FAILED` logs with a `retryCount < 3`. It re-attempts delivery, incrementing the retry counter until successful or the maximum attempts are exhausted.
