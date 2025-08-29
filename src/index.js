require('dotenv').config();
const { Telegraf } = require('telegraf');
const { scheduleDaily } = require('./scheduler');
const { sendMail } = require('./gmail');
const { createCalendarEvent } = require('./calendar');
const { runDailyAutomation } = require('./api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Basic commands
bot.start((ctx) => ctx.reply('👋 Hi! I am your automation bot. Use /ping or /schedule_demo to test.'));
bot.command('ping', (ctx) => ctx.reply('pong'));
bot.command('schedule_demo', async (ctx) => {
  try {
    await runFullDailyFlow({ trigger: 'manual', chatId: ctx.chat?.id });
    ctx.reply('✅ Demo job executed.');
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Demo failed: ' + err.message);
  }
});

// Long polling (simple dev setup)
bot.launch().then(() => console.log('🤖 Bot started (long polling)…')).catch(console.error);

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Schedule the daily job
scheduleDaily(async () => {
  await runFullDailyFlow({ trigger: 'schedule' });
});

async function runFullDailyFlow({ trigger, chatId }) {
  // 1) Your business logic (edit src/api.js)
  const result = await runDailyAutomation();

  // 2) Send an email summary (edit recipient/subject as needed)
  try {
    await sendMail({
      to: process.env.GMAIL_SENDER, // send to yourself by default
      subject: `Daily Automation (${new Date().toLocaleString()})`,
      text: `Trigger: ${trigger}\nResult: ${JSON.stringify(result, null, 2)}`
    });
    console.log('📧 Email sent');
  } catch (e) {
    console.error('Email error:', e.message);
  }

  // 3) (Optional) Create a Calendar event
  try {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000); // +30 min
    await createCalendarEvent({
      summary: 'Daily Automation Check-in',
      description: 'Scheduled by Telegram bot starter',
      start: now,
      end,
      attendees: [] // e.g., [{ email: 'teammate@example.com' }]
    });
    console.log('📅 Calendar event created');
  } catch (e) {
    console.error('Calendar error:', e.message);
  }

  // 4) Telegram notify a chat (if provided)
  const notifyChatId = chatId || process.env.TELEGRAM_NOTIFY_CHAT_ID;
  if (notifyChatId) {
    try {
      await bot.telegram.sendMessage(
        notifyChatId,
        `Daily job done ✅\nTrigger: ${trigger}\nAt: ${new Date().toLocaleString()}`
      );
    } catch (e) {
      console.error('Telegram notify error:', e.message);
    }
  }
}
