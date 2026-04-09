const express = require("express");
const { UploadsController, upload } = require("./uploads.controller");
const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.post(
  "/signature",
  upload.single("signature"),
  UploadsController.uploadSignature,
);
router.post("/logo", upload.single("logo"), UploadsController.uploadLogo);

module.exports = router;
