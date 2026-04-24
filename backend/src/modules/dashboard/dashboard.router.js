const express = require("express");
const OwnerDashboardController = require("./dashboard.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { restrictTo } = require("../../middlewares/rbac.middleware");

const router = express.Router();

router.use(protect);
router.use(restrictTo("OWNER"));

router.get("/stats", OwnerDashboardController.getStats);
router.get("/export", OwnerDashboardController.exportReport);

module.exports = router;
