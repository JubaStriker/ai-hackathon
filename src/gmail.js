const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
  GMAIL_SENDER
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('⚠️ Missing Google OAuth env vars. Gmail/Calendar features may not work until set.');
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
if (GOOGLE_REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
}

async function getAccessToken() {
  const { token } = await oAuth2Client.getAccessToken();
  if (!token) throw new Error('Failed to obtain access token');
  return token;
}

async function sendMail({ to, subject, text, html }) {
  if (!GMAIL_SENDER) throw new Error('GMAIL_SENDER is not set');
  const accessToken = await getAccessToken();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_SENDER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken
    }
  });

  const info = await transporter.sendMail({
    from: GMAIL_SENDER,
    to,
    subject,
    text,
    html
  });
  return info;
}

module.exports = { sendMail };
