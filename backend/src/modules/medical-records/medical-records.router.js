const express = require("express");
const router = express.Router();
const MedicalRecordsController = require("./medical-records.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { restrictTo } = require("../../middlewares/rbac.middleware");

// Solo los médicos pueden gestionar expedientes detallados según requerimiento de privacidad
router.use(protect);
router.use(restrictTo("DOCTOR"));

router.get("/", MedicalRecordsController.getAllRecords);
router.get("/:patientId/history", MedicalRecordsController.getHistory);
router.get("/:patientId/consents", MedicalRecordsController.listConsents);
router.post("/:patientId/consents", MedicalRecordsController.upsertConsent);
router.get("/:patientId", MedicalRecordsController.getRecord);
router.patch("/:patientId", MedicalRecordsController.updateRecord);
router.post("/:patientId/notes", MedicalRecordsController.addNote);
router.post("/notes/:noteId/sign", MedicalRecordsController.signNote);

module.exports = router;
