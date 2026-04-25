const express = require("express");
const RemindersController = require("./reminders.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { restrictTo } = require("../../middlewares/rbac.middleware");

const router = express.Router();

router.get("/webhook", RemindersController.verifyWebhook);
router.post("/webhook", RemindersController.receiveWebhook);

router.use(protect);
router.use(restrictTo("OWNER", "RECEPTIONIST"));

router.post("/jobs/run-24h", RemindersController.run24hJob);
router.post("/:appointmentId/send-now", RemindersController.sendNow);
router.get("/logs", RemindersController.getLogs);
router.get("/config-status", RemindersController.getConfigStatus);
router.post("/config", restrictTo("OWNER"), RemindersController.updateConfig);
router.post(
  "/test-message",
  restrictTo("OWNER"),
  RemindersController.sendTestMessage,
);
router.post(
  "/test-message/patients",
  restrictTo("OWNER"),
  RemindersController.sendTestToPatients,
);

module.exports = router;
