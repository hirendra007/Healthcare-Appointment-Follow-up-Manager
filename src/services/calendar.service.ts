import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class CalendarService {
  /**
   * Generates the Google OAuth consent screen URL.
   */
  static getAuthUrl(state?: string) {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      state,
    });
  }

  /**
   * Exchanges an authorization code for tokens.
   */
  static async getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Creates a calendar event for a booked appointment.
   */
  static async createEvent(
    tokens: any,
    eventDetails: {
      summary: string;
      description: string;
      startTime: Date;
      endTime: Date;
      attendees?: string[]; // Patient and Doctor emails
    }
  ): Promise<string | null> {
    try {
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventDetails.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: eventDetails.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all',
      });

      return res.data.id || null;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      // Fail gracefully so we don't break the booking flow if Google API fails
      return null;
    }
  }

  /**
   * Updates an existing calendar event (e.g., on reschedule).
   */
  static async updateEvent(
    tokens: any,
    eventId: string,
    updates: {
      startTime: Date;
      endTime: Date;
    }
  ) {
    try {
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: {
          start: {
            dateTime: updates.startTime.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: updates.endTime.toISOString(),
            timeZone: 'UTC',
          },
        },
        sendUpdates: 'all',
      });
      return true;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return false;
    }
  }

  /**
   * Deletes a calendar event (e.g., on cancellation).
   */
  static async deleteEvent(tokens: any, eventId: string) {
    try {
      oauth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all', // Notifies attendees
      });
      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }
}
