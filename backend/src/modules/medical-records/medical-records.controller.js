const MedicalRecordsService = require("./medical-records.service");
const ApiResponse = require("../../utils/apiResponse");

const getAllRecords = async (req, res) => {
  try {
    const records = await MedicalRecordsService.getAllRecordsByDoctor(
      req.user.id,
    );
    return ApiResponse.success(
      res,
      "Expedientes obtenidos correctamente.",
      records,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const getRecord = async (req, res) => {
  try {
    const record = await MedicalRecordsService.getOrCreateRecord(
      req.user.id,
      req.params.patientId,
      {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    );
    return ApiResponse.success(
      res,
      "Expediente obtenido correctamente.",
      record,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await MedicalRecordsService.getHistory(
      req.user.id,
      req.params.patientId,
    );
    return ApiResponse.success(
      res,
      "Historial clínico obtenido correctamente.",
      history,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecordsService.updateRecord(
      req.user.id,
      req.params.patientId,
      req.body,
      req.ip,
      req.headers["user-agent"],
    );
    return ApiResponse.success(
      res,
      "Expediente actualizado correctamente.",
      record,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const signNote = async (req, res) => {
  try {
    const note = await MedicalRecordsService.signNote(
      req.user.id,
      req.params.noteId,
      req.ip,
      req.headers["user-agent"],
    );
    return ApiResponse.success(res, "Nota firmada correctamente.", note);
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const addNote = async (req, res) => {
  try {
    const note = await MedicalRecordsService.addProgressNote(
      req.user.id,
      req.params.patientId,
      req.body,
      req.ip,
      req.headers["user-agent"],
    );
    return ApiResponse.success(
      res,
      "Nota de evolución creada correctamente.",
      note,
      201,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const upsertConsent = async (req, res) => {
  try {
    const consent = await MedicalRecordsService.upsertConsent(
      req.user.id,
      req.params.patientId,
      req.body,
      req.ip,
      req.headers["user-agent"],
    );
    return ApiResponse.success(
      res,
      "Consentimiento guardado correctamente.",
      consent,
      201,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

const listConsents = async (req, res) => {
  try {
    const consents = await MedicalRecordsService.listConsents(
      req.user.id,
      req.params.patientId,
    );
    return ApiResponse.success(
      res,
      "Consentimientos obtenidos correctamente.",
      consents,
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  getAllRecords,
  getRecord,
  getHistory,
  updateRecord,
  signNote,
  addNote,
  upsertConsent,
  listConsents,
};
