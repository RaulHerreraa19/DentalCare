const MedicalRecordsService = require('./medical-records.service');

const getRecord = async (req, res) => {
  try {
    const record = await MedicalRecordsService.getOrCreateRecord(req.user.id, req.params.patientId);
    res.json({ status: 'success', data: record });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecordsService.updateRecord(req.user.id, req.params.patientId, req.body, req.ip);
    res.json({ status: 'success', data: record });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

const signNote = async (req, res) => {
  try {
    const note = await MedicalRecordsService.signNote(req.user.id, req.params.noteId, req.ip);
    res.json({ status: 'success', data: note });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const note = await MedicalRecordsService.addProgressNote(req.user.id, req.params.patientId, req.body, req.ip);
    res.status(201).json({ status: 'success', data: note });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getRecord,
  updateRecord,
  signNote,
  addNote
};
