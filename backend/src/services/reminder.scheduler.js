const RemindersService = require("../modules/reminders/reminders.service");

let timer = null;

class ReminderScheduler {
  static start() {
    if (timer) return;

    const intervalMs = Number(
      process.env.REMINDERS_JOB_INTERVAL_MS || 5 * 60 * 1000,
    );

    const run = async () => {
      try {
        const result = await RemindersService.processUpcoming24hReminders();
        console.log("📲 Reminder job result:", result);
      } catch (error) {
        console.error("❌ Reminder job failed:", error.message);
      }
    };

    run();
    timer = setInterval(run, intervalMs);
    console.log(`⏰ Reminder scheduler running every ${intervalMs}ms`);
  }

  static stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}

module.exports = ReminderScheduler;
