require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const userStates = {};

// ========== Gmail Setup ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SENDER,
    pass: process.env.GMAIL_PASS
  }
});

// ========== Google Calendar Setup ==========
const oAuth2Client = new google.auth.OAuth2(
  process.env.GCAL_CLIENT_ID,
  process.env.GCAL_CLIENT_SECRET,
  process.env.GCAL_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GCAL_REFRESH_TOKEN });
const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// ========== Daily Scheduler ==========
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily automation...');
  await runFullDailyFlow({ trigger: 'schedule' });
}, { timezone: "Asia/Dhaka" });

// ========== Command: Get Leads ==========
bot.onText(/\/getleads/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: 'waiting_for_titles' };
  bot.sendMessage(chatId, 'Please enter job titles separated by commas, e.g., business, product');
});

// Handle user messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (userStates[chatId]?.step === 'waiting_for_titles') {
    const titles = msg.text.split(',').map(t => t.trim());
    userStates[chatId] = null;

    bot.sendMessage(chatId, `Searching leads for: ${titles.join(', ')}`);
    await fetchLeads(chatId, titles);
  }
});

// ========== Fetch Leads ==========
async function fetchLeads(chatId, titles) {
  try {
    const response = await axios.post(
      'https://api.apollo.io/api/v1/mixed_people/search',
      { person_titles: titles, per_page: 10 },
      { headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.APOLLO_API_KEY } }
    );

    const leads = response.data.people || [];
    if (leads.length === 0) return bot.sendMessage(chatId, 'No leads found.');

    let message = 'Top Leads:\n\n';
    leads.forEach((lead, i) => {
      message += `${i + 1}. ${lead.first_name || ''} ${lead.last_name || ''} - ${lead.organization?.name || 'N/A'}\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (err) {
    console.error('Apollo API Error:', err.response?.data ?? err.message);
    bot.sendMessage(chatId, 'Error fetching leads. Check logs for details.');
  }
}

// ========== Daily Automation Flow ==========
async function runFullDailyFlow({ trigger, chatId }) {
  const result = { status: 'success', time: new Date().toLocaleString() };

  // 1. Send Email
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_SENDER,
      to: process.env.GMAIL_SENDER,
      subject: `Daily Automation (${result.time})`,
      text: `Trigger: ${trigger}\nResult: ${JSON.stringify(result, null, 2)}`
    });
    console.log('📧 Email sent');
  } catch (e) {
    console.error('Email Error:', e.message);
  }

  // 2. Create Calendar Event
  try {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: 'Daily Automation Check-in',
        description: 'Scheduled by Telegram bot',
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Dhaka' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Dhaka' }
      }
    });
    console.log('📅 Calendar event created');
  } catch (e) {
    console.error('Calendar Error:', e.message);
  }

  // 3. Notify Telegram
  const notifyChatId = chatId || process.env.TELEGRAM_NOTIFY_CHAT_ID;
  if (notifyChatId) {
    try {
      await bot.sendMessage(notifyChatId, `Daily job done ✅\nTrigger: ${trigger}\nAt: ${result.time}`);
    } catch (e) {
      console.error('Telegram Notify Error:', e.message);
    }
  }
}

console.log('🚀 Bot is running...');
