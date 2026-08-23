# Complete Setup Guide

This guide will walk you through exactly how to obtain all the required credentials for your `.env` file and how to run the project locally.

---

## 1. Environment Variables Checklist (`.env`)

Copy the contents of `.env.example` into a new `.env` file in the root of your project. Below is exactly how to get each value.

### Database (Neon PostgreSQL)
1. Go to [Neon.tech](https://neon.tech/) and create a free account/project.
2. In your project dashboard, find the **Connection Details** section.
3. For `DATABASE_URL` (Pooled Connection):
   - Make sure the "Pooled connection" checkbox is **ON**.
   - Copy the string and set it as `DATABASE_URL`. It usually looks like: `postgresql://user:pass@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require`
4. For `DIRECT_URL` (Direct Connection):
   - Uncheck the "Pooled connection" checkbox (or grab the direct URL from the settings).
   - Copy the string and set it as `DIRECT_URL`. It usually looks like: `postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require`

### Authentication (NextAuth)
1. **NEXTAUTH_SECRET**: This is used to encrypt JWT sessions. 
   - You can generate a secure one by running this in your terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - Alternatively, just use any long random string for local development (e.g., `my-super-secret-key-12345`).
2. **NEXTAUTH_URL**: Set this to `http://localhost:3000` for local development.

### AI Summaries (Google Gemini)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy the key and set it as `GEMINI_API_KEY`.

### Google Calendar Sync (OAuth 2.0)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. In the sidebar, go to **APIs & Services > Library** and search for **Google Calendar API**. Click **Enable**.
4. Go to **APIs & Services > OAuth consent screen**. 
   - Choose "External" (or "Internal" if you have Google Workspace).
   - Fill in the required fields (App Name, User Support Email, Developer Email).
   - Under "Scopes", add `https://www.googleapis.com/auth/calendar.events`.
5. Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - Under **Authorized redirect URIs**, add exactly: `http://localhost:3000/api/calendar/callback`.
6. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
7. **GOOGLE_REDIRECT_URI** should remain `http://localhost:3000/api/calendar/callback`.

### Emails (Nodemailer / Gmail)
To send emails using a free Gmail account:
1. Go to your [Google Account Manage page](https://myaccount.google.com/).
2. Navigate to **Security** and enable **2-Step Verification** (required).
3. Search for **App Passwords** in the top search bar (or find it under 2-Step Verification settings).
4. Create a new App Password (name it "Clinic App" or similar).
5. Copy the 16-character password (without spaces).
6. Update your `.env`:
   - `SMTP_HOST="smtp.gmail.com"`
   - `SMTP_PORT="587"`
   - `SMTP_USER="your.email@gmail.com"` (Your actual Gmail address)
   - `SMTP_PASS="the-16-char-app-password"`
   - `EMAIL_FROM="Clinic Care <your.email@gmail.com>"`

### Background Jobs (Cron)
- **CRON_SECRET**: This protects your cron routes from being manually triggered by outsiders. 
- Set it to any random string (e.g., `my-cron-secret-123`).

---

## 2. How to Run the Project Locally

Once your `.env` file is fully populated, follow these steps to start the application:

### Step 1: Install Dependencies
Open your terminal in the project directory (`d:\VS code\website\unthinkable_proj`) and run:
```bash
npm install
```

### Step 2: Set up the Database
Push your Prisma schema to the Neon database to create all the necessary tables (Users, Appointments, etc.):
```bash
npx prisma migrate dev --name init
```
*(Note: If you run into any issues, ensure your `DIRECT_URL` in `.env` is correct, as Prisma uses the direct URL to run migrations).*

Generate the Prisma Client so you have all the TypeScript types:
```bash
npx prisma generate
```

### Step 3: Start the Development Server
Run the Next.js development server:
```bash
npm run dev
```

### Step 4: View the Application
Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

You should see the Home Page with links to the Patient, Doctor, and Admin portals!

---

## 3. Testing Background Jobs Locally
Because Vercel Cron won't trigger automatically on your local machine, you can trigger the jobs manually using an API client like Postman, ThunderClient, or `curl`:

For example, to test medication reminders:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/medication-reminders
```
*(Replace `YOUR_CRON_SECRET` with the string you set in your `.env` file).*
