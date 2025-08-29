const { google } = require('googleapis');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_CALENDAR_ID
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
if (GOOGLE_REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
}

async function createCalendarEvent({ summary, description, start, end, attendees = [] }) {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const res = await calendar.events.insert({
    calendarId: GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees
    }
  });
  return res.data;
}

module.exports = { createCalendarEvent };
