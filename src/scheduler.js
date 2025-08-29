const cron = require('node-cron');

const TZ = process.env.TIMEZONE || 'UTC';
const DEFAULT_DAILY_TIME = process.env.DEFAULT_DAILY_TIME || '09:00'; // HH:mm

function timeToCron(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number);
  if (
    Number.isNaN(hour) || Number.isNaN(minute) ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    throw new Error(`Bad DEFAULT_DAILY_TIME: ${hhmm}`);
  }
  // sec min hour dom mon dow
  return `0 ${minute} ${hour} * * *`;
}

function scheduleDaily(job) {
  const expr = timeToCron(DEFAULT_DAILY_TIME);
  console.log(`⏰ Scheduling daily job at ${DEFAULT_DAILY_TIME} (${TZ}) -> ${expr}`);
  return cron.schedule(expr, job, { timezone: TZ });
}

module.exports = { scheduleDaily };
