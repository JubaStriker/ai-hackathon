require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');

const app = express();
const port = 3000;

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.error('Set GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI in .env first.');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events'
];

app.get('/auth', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  console.log('\nOpen this URL in your browser to authorize:');
  console.log(url, '\n');
  res.send('Check your console for the Auth URL. Open it in your browser.');
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('\n✅ Received tokens:\n', tokens, '\n');
    console.log('➡️  Save the refresh_token above into GOOGLE_REFRESH_TOKEN in your .env\n');
    res.send('Tokens received. Check your console. You can close this window.');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error exchanging code for tokens.');
  }
});

app.listen(port, () => {
  console.log(`OAuth helper listening on http://localhost:${port}`);
  console.log('Visit http://localhost:3000/auth to start the flow.');
});
