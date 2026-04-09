require("dotenv").config();
const app = require("./app");
const db = require("./config/database");
const ReminderScheduler = require("./services/reminder.scheduler");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Database check
    await db.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
      );
      ReminderScheduler.start();
    });
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1);
  }
};

startServer();
