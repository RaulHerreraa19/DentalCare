import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import OdontogramVisualizer, { normalizeOdontogramRecords } from '../../components/odontogram/OdontogramVisualizer';
import {
  User,
  FileText,
  Clipboard,
  AlertCircle,
  Activity,
  Save,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Stethoscope,
  Clock,
  Printer,
  Plus,
  Trash2,
  Lock,
  Building2,
  Brush,
  Crosshair,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle
} from 'lucide-react';

const CONSENT_LIBRARY = {
  DATA_PRIVACY: {
    title: 'Consentimiento para tratamiento de datos personales sensibles',
    short: 'Autorizo el tratamiento de mis datos personales y sensibles para fines de atencion odontologica.',
    content: 'Yo, [nombre completo del paciente o representante], manifiesto que se me informó el aviso de privacidad y otorgo mi consentimiento expreso para el tratamiento de mis datos personales y datos personales sensibles, incluyendo datos de salud, antecedentes clínicos, diagnósticos, imágenes clínicas, radiografías, fotografías, recetas, notas médicas y demás información necesaria para mi atención odontológica, integración y conservación de mi expediente clínico, gestión de citas, seguimiento, facturación y cumplimiento de obligaciones legales.',
    signature_type: 'CLICK_WRAP'
  },
  DENTAL_TREATMENT: {
    title: 'Consentimiento para atención odontológica',
    short: 'Autorizo la valoración, diagnóstico y tratamiento odontológico conforme al plan explicado.',
    content: 'Yo, [nombre completo], declaro que se me explicó de manera clara mi estado de salud bucal, el diagnóstico presuntivo o definitivo, el plan de tratamiento propuesto, los riesgos previsibles y las alternativas terapéuticas.',
    signature_type: 'CLICK_WRAP'
  },
  WHATSAPP: {
    title: 'Consentimiento para uso de WhatsApp',
    short: 'Autorizo el uso de WhatsApp para citas, recordatorios e indicaciones.',
    content: 'Autorizo expresamente a contactarme por medios electrónicos, incluyendo WhatsApp, SMS, llamada telefónica, correo electrónico para agendado, recordatorios de cita, envío de indicaciones y seguimiento clínico.',
    signature_type: 'CLICK_WRAP'
  }
};

const EMPTY_RECORD = {
  family_history: '',
  pathological_history: '',
  non_pathological_history: '',
  allergies: '',
  surgeries: '',
  current_medications: '',
  dental_history: '',
  brushing_frequency: '',
  use_floss: false,
  chief_complaint: '',
  symptoms_start_date: '',
  pain_presence: false,
  pain_intensity: '',
  pain_character: '',
  pain_location: '',
  pain_triggers: '',
  pain_relief: '',
  review_of_systems: '',
  extraoral_exam: '',
  intraoral_exam: '',
  periodontal_status: '',
  radiographic_findings: '',
  blood_pressure: '',
  heart_rate: '',
  respiratory_rate: '',
  temperature: '',
  oxygen_saturation: '',
  weight_kg: '',
  height_cm: '',
  primary_diagnosis: '',
  secondary_diagnoses: '',
  icd10_code: '',
  diagnostic_basis: '',
  treatment_objective: '',
  proposed_procedures: [{ name: '', tooth: '', code: '' }],
  treatment_plan: '',
  risks_explained: '',
  alternatives_explained: '',
  follow_up_plan: '',
  estimated_cost: '',
  note_summary: '',
  tooth_entries: [{ tooth_number: '', status: '', surfaces: '', finding_text: '', treatment_text: '' }]
};

const EMPTY_CONSENTS_STATE = Object.keys(CONSENT_LIBRARY).reduce((acc, key) => {
  acc[key] = {
    accepted: false,
    title: CONSENT_LIBRARY[key].title,
    content: CONSENT_LIBRARY[key].content,
    signature_type: CONSENT_LIBRARY[key].signature_type,
    version: 0,
    latestAcceptedAt: null,
  };
  return acc;
}, {});

const extractClinicalNotes = (recordData = {}) => {
  const clinicalNotes = recordData?.clinical_notes && typeof recordData.clinical_notes === 'object'
    ? recordData.clinical_notes
    : {};
  const sections = clinicalNotes.sections && typeof clinicalNotes.sections === 'object'
    ? clinicalNotes.sections
    : clinicalNotes;

  return {
    history: sections.history || {},
    interview: sections.interview || {},
    exploration: sections.exploration || {},
    diagnosis: sections.diagnosis || {},
    plan: sections.plan || {},
    odontogram: sections.odontogram || {},
    note_summary: clinicalNotes.note_summary || recordData?.note_summary || '',
  };
};

const buildClinicalNotesPayload = (form, odontogramRecords) => ({
  sections: {
    history: {
      family_history: form.family_history,
      pathological_history: form.pathological_history,
      non_pathological_history: form.non_pathological_history,
      allergies: form.allergies,
      surgeries: form.surgeries,
      current_medications: form.current_medications,
      dental_history: form.dental_history,
      brushing_frequency: form.brushing_frequency,
      use_floss: form.use_floss,
    },
    interview: {
      chief_complaint: form.chief_complaint,
      symptoms_start_date: form.symptoms_start_date || null,
      pain_presence: form.pain_presence,
      pain_intensity: form.pain_intensity === '' ? null : Number(form.pain_intensity),
      pain_character: form.pain_character,
      pain_location: form.pain_location,
      pain_triggers: form.pain_triggers,
      pain_relief: form.pain_relief,
      review_of_systems: form.review_of_systems,
    },
    exploration: {
      extraoral_exam: form.extraoral_exam,
      intraoral_exam: form.intraoral_exam,
      periodontal_status: form.periodontal_status,
      radiographic_findings: form.radiographic_findings,
      vital_signs: {
        blood_pressure: form.blood_pressure,
        heart_rate: form.heart_rate,
        respiratory_rate: form.respiratory_rate,
        temperature: form.temperature,
        oxygen_saturation: form.oxygen_saturation,
        weight_kg: form.weight_kg,
        height_cm: form.height_cm,
      },
    },
    diagnosis: {
      primary_diagnosis: form.primary_diagnosis,
      secondary_diagnoses: splitDiagnoses(form.secondary_diagnoses),
      icd10_code: form.icd10_code,
      diagnostic_basis: form.diagnostic_basis,
    },
    plan: {
      treatment_objective: form.treatment_objective,
      proposed_procedures: (form.proposed_procedures || []).filter((item) => item.name.trim()),
      treatment_plan: form.treatment_plan,
      risks_explained: form.risks_explained,
      alternatives_explained: form.alternatives_explained,
      follow_up_plan: form.follow_up_plan,
      estimated_cost: form.estimated_cost === '' ? null : Number(form.estimated_cost),
    },
    odontogram: {
      tooth_data: odontogramRecords,
    },
  },
  note_summary: form.note_summary,
  saved_at: new Date().toISOString(),
});

const normalizeRecord = (data = {}) => ({
  const explorationFromNotes = extractClinicalNotes(data).exploration || {};
  const vitalSigns = explorationFromNotes.vital_signs || {};

  return ({
  ...EMPTY_RECORD,
  ...extractClinicalNotes(data).history,
  ...extractClinicalNotes(data).interview,
  ...explorationFromNotes,
  ...extractClinicalNotes(data).diagnosis,
  ...extractClinicalNotes(data).plan,
  ...data,
  blood_pressure: vitalSigns.blood_pressure || '',
  heart_rate: vitalSigns.heart_rate || '',
  respiratory_rate: vitalSigns.respiratory_rate || '',
  temperature: vitalSigns.temperature || '',
  oxygen_saturation: vitalSigns.oxygen_saturation || '',
  weight_kg: vitalSigns.weight_kg || '',
  height_cm: vitalSigns.height_cm || '',
  proposed_procedures: Array.isArray(extractClinicalNotes(data).plan?.proposed_procedures) && extractClinicalNotes(data).plan.proposed_procedures.length > 0
    ? extractClinicalNotes(data).plan.proposed_procedures
    : Array.isArray(data?.proposed_procedures) && data.proposed_procedures.length > 0
      ? data.proposed_procedures
      : EMPTY_RECORD.proposed_procedures,
  tooth_entries: Array.isArray(data?.tooth_entries) && data.tooth_entries.length > 0
    ? data.tooth_entries
    : normalizeToothEntries(extractClinicalNotes(data).odontogram?.tooth_data || data?.tooth_data || data?.odontogram || []),
  note_summary: extractClinicalNotes(data).note_summary || data?.note_summary || '',
  close_record: data?.status === 'CLOSED',
  });
};

const STEPS = [
  { id: 1, label: 'Paciente', icon: User },
  { id: 2, label: 'Antecedentes', icon: FileText },
  { id: 3, label: 'Interrogatorio', icon: Clipboard },
  { id: 4, label: 'Exploración', icon: Stethoscope },
  { id: 5, label: 'Odontograma', icon: Brush },
  { id: 6, label: 'Diagnóstico', icon: AlertCircle },
  { id: 7, label: 'Consentimientos', icon: ShieldCheck },
  { id: 8, label: 'Resumen', icon: CheckCircle }
];

export default function MedicalRecordWizard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const appointmentId = searchParams.get('appointmentId');

  const [currentStep, setCurrentStep] = useState(1);
  const [record, setRecord] = useState(EMPTY_RECORD);
  const [patient, setPatient] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [odontogramRecords, setOdontogramRecords] = useState([]);
  const [consents, setConsents] = useState({
    DATA_PRIVACY: false,
    DENTAL_TREATMENT: false,
    WHATSAPP: false,
  });
  const [baselineConsents, setBaselineConsents] = useState(EMPTY_CONSENTS_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        await loadPatientData({ signal: controller.signal, mountedRef: { mountedRef: () => mounted } });
      } catch (e) {
        /* ignore */
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [patientId, appointmentId]);

  const loadPatientData = async ({ signal, mountedRef } = {}) => {
    try {
      const [patientRes, recordRes, consentsRes] = await Promise.all([
        api.get(`/patients/${patientId}`, { signal }),
        api.get(`/medical-records/${patientId}`, { signal }),
        api.get(`/medical-records/${patientId}/consents`, { signal })
      ]);

      if (mountedRef && !mountedRef.mountedRef()) return;
      setPatient(patientRes.data.data);
      if (recordRes.data.data) {
        setRecord(normalizeRecord(recordRes.data.data));
        setOdontogramRecords(
          normalizeOdontogramRecords(
            recordRes.data.data?.tooth_data || recordRes.data.data?.odontogram || recordRes.data.data?.tooth_entries || [],
            patientId,
            user?.id,
          ),
        );
      }

      const latestConsents = (consentsRes.data.data || []).reduce((acc, consent) => {
        const current = acc[consent.consent_type];
        if (!current || consent.version >= current.version) {
          acc[consent.consent_type] = {
            accepted: consent.accepted,
            title: consent.title || current?.title || consent.consent_type,
            content: consent.content || current?.content || '',
            signature_type: consent.signature_type || current?.signature_type || 'CLICK_WRAP',
            version: consent.version || 0,
            latestAcceptedAt: consent.accepted_at || null,
          };
        }
        return acc;
      }, JSON.parse(JSON.stringify(EMPTY_CONSENTS_STATE)));
      if (mountedRef && !mountedRef.mountedRef()) return;
      setBaselineConsents(latestConsents);
      setConsents(Object.keys(latestConsents).reduce((acc, key) => {
        acc[key] = latestConsents[key].accepted;
        return acc;
      }, {}));

      if (appointmentId) {
        const appointmentRes = await api.get(`/appointments/${appointmentId}`, { signal });
        if (mountedRef && !mountedRef.mountedRef()) return;
        setAppointment(appointmentRes.data.data);
        if (appointmentRes.data.data?.session_note) {
          setRecord(prev => ({
            ...normalizeRecord(prev),
            note_summary: appointmentRes.data.data.session_note,
          }));
        }
      }

      if (mountedRef && !mountedRef.mountedRef()) return;
      setLoading(false);
    } catch (error) {
      if (error.name === 'AbortError') return;
      Swal.fire('Error', error.response?.data?.message || 'Error al cargar datos', 'error');
      if (mountedRef && !mountedRef.mountedRef()) return;
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleProcedureChange = (index, field, value) => {
    const procedures = [...(record.proposed_procedures || EMPTY_RECORD.proposed_procedures)];
    procedures[index] = { ...procedures[index], [field]: value };
    setRecord(prev => ({ ...prev, proposed_procedures: procedures }));
  };

  const addProcedure = () => {
    setRecord(prev => ({
      ...prev,
      proposed_procedures: [...(prev.proposed_procedures || EMPTY_RECORD.proposed_procedures), { name: '', tooth: '', code: '' }]
    }));
  };

  const removeProcedure = (index) => {
    setRecord(prev => ({
      ...prev,
      proposed_procedures: (prev.proposed_procedures || EMPTY_RECORD.proposed_procedures).filter((_, i) => i !== index)
    }));
  };

  const saveRecord = async () => {
    try {
      setSaving(true);
      const response = await api.patch(`/medical-records/${patientId}`, {
        ...record,
        status: 'CLOSED',
        tooth_data: odontogramRecords,
        clinical_notes: buildClinicalNotesPayload(record, odontogramRecords),
      });
      Swal.fire('Guardado', 'Expediente guardado exitosamente', 'success');
      return response.data.data;
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await saveRecord();

      const consentChanges = Object.keys(consents).filter(
        (key) => consents[key] !== baselineConsents[key]?.accepted,
      );

      for (const consentType of consentChanges) {
        const base = baselineConsents[consentType] || EMPTY_CONSENTS_STATE[consentType];
        await api.post(`/medical-records/${patientId}/consents`, {
          consent_type: consentType,
          title: base.title,
          content: base.content,
          accepted: consents[consentType],
          signature_type: base.signature_type,
          language: 'es_MX',
          revoked: baselineConsents[consentType]?.accepted && !consents[consentType],
          revoked_reason: baselineConsents[consentType]?.accepted && !consents[consentType] ? 'Revocado desde el expediente clínico' : null,
        });
      }
      
      if (appointmentId) {
        await api.patch(`/appointments/${appointmentId}`, {
          status: 'COMPLETED',
          notes: record.note_summary
        });
      }

      Swal.fire('Completado', 'Expediente finalizado', 'success');
      navigate(`/doctor/followup`);
    } catch (error) {
      Swal.fire('Error', 'Error al finalizar expediente', 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  const currentStepData = STEPS[currentStep - 1];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft size={20} />
              Atrás
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              Expediente Clínico: {patient?.first_name} {patient?.last_name}
            </h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    currentStep === step.id
                      ? 'text-blue-600'
                      : currentStep > step.id
                      ? 'text-green-600'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      currentStep === step.id
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : currentStep > step.id
                        ? 'bg-green-100 border-2 border-green-600'
                        : 'bg-slate-200 border-2 border-slate-300'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle size={24} />
                    ) : (
                      <step.icon size={24} />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center max-w-20">
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <CurrentIcon size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">{currentStepData.label}</h2>
          </div>

          {/* Step 1: Patient Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Paciente:</strong> {patient?.first_name} {patient?.last_name}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Cédula/Pasaporte:</strong> {patient?.id?.substring(0, 8)}...
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Teléfono:</strong> {patient?.phone}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Medical History */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Antecedentes Familiares
                </label>
                <textarea
                  value={record.family_history}
                  onChange={(e) => handleInputChange('family_history', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enfermedades hereditarias, cáncer, diabetes, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Antecedentes Patológicos
                </label>
                <textarea
                  value={record.pathological_history}
                  onChange={(e) => handleInputChange('pathological_history', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enfermedades previas, hospitalizaciones, cirugías"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Alergias
                </label>
                <textarea
                  value={record.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Alergias a medicamentos, alimentos, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Medicamentos Actuales
                </label>
                <textarea
                  value={record.current_medications}
                  onChange={(e) => handleInputChange('current_medications', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Medicamentos que toma actualmente"
                />
              </div>
            </div>
          )}

          {/* Step 3: Chief Complaint & Pain */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Queja Principal
                </label>
                <textarea
                  value={record.chief_complaint}
                  onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="¿Cuál es el motivo de la consulta?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    ¿Tiene dolor?
                  </label>
                  <select
                    value={record.pain_presence ? 'yes' : 'no'}
                    onChange={(e) => handleInputChange('pain_presence', e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Sí</option>
                  </select>
                </div>
                {record.pain_presence && (
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Intensidad (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={record.pain_intensity}
                      onChange={(e) => handleInputChange('pain_intensity', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              {record.pain_presence && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Carácter del dolor
                    </label>
                    <input
                      type="text"
                      value={record.pain_character}
                      onChange={(e) => handleInputChange('pain_character', e.target.value)}
                      placeholder="Punzante, sordo, pulsátil, ardiente, etc."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Localización
                    </label>
                    <input
                      type="text"
                      value={record.pain_location}
                      onChange={(e) => handleInputChange('pain_location', e.target.value)}
                      placeholder="¿Dónde siente el dolor?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Examination */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">Signos Vitales</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">TA (mmHg)</label>
                    <input
                      type="text"
                      value={record.blood_pressure || ''}
                      onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
                      placeholder="120/80"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">FC (lpm)</label>
                    <input
                      type="text"
                      value={record.heart_rate || ''}
                      onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                      placeholder="72"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">FR (rpm)</label>
                    <input
                      type="text"
                      value={record.respiratory_rate || ''}
                      onChange={(e) => handleInputChange('respiratory_rate', e.target.value)}
                      placeholder="16"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Temp (°C)</label>
                    <input
                      type="text"
                      value={record.temperature || ''}
                      onChange={(e) => handleInputChange('temperature', e.target.value)}
                      placeholder="36.5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">SpO2 (%)</label>
                    <input
                      type="text"
                      value={record.oxygen_saturation || ''}
                      onChange={(e) => handleInputChange('oxygen_saturation', e.target.value)}
                      placeholder="98"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Peso (kg)</label>
                    <input
                      type="text"
                      value={record.weight_kg || ''}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                      placeholder="70"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Talla (cm)</label>
                    <input
                      type="text"
                      value={record.height_cm || ''}
                      onChange={(e) => handleInputChange('height_cm', e.target.value)}
                      placeholder="170"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Examen Extraoral
                </label>
                <textarea
                  value={record.extraoral_exam}
                  onChange={(e) => handleInputChange('extraoral_exam', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Observaciones faciales, articulaciones, ganglios, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Examen Intraoral
                </label>
                <textarea
                  value={record.intraoral_exam}
                  onChange={(e) => handleInputChange('intraoral_exam', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Encías, tejidos blandos, piezas dentarias, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Hallazgos Radiográficos
                </label>
                <textarea
                  value={record.radiographic_findings}
                  onChange={(e) => handleInputChange('radiographic_findings', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Observaciones de radiografías, TAC, etc."
                />
              </div>
            </div>
          )}

          {/* Step 5: Odontogram */}
          {currentStep === 5 && (
            <OdontogramVisualizer
              value={odontogramRecords}
              onChange={setOdontogramRecords}
              patientId={patientId}
              createdBy={user?.id}
              subtitle="Haz clic sobre una pieza para abrir el panel lateral y registrar su historial clínico."
            />
          )}

          {/* Step 6: Diagnosis & Plan */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Diagnóstico Primario
                </label>
                <input
                  type="text"
                  value={record.primary_diagnosis}
                  onChange={(e) => handleInputChange('primary_diagnosis', e.target.value)}
                  placeholder="Diagnóstico principal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Código ICD-10
                </label>
                <input
                  type="text"
                  value={record.icd10_code}
                  onChange={(e) => handleInputChange('icd10_code', e.target.value)}
                  placeholder="Ej: K02.9"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Objetivo del Tratamiento
                </label>
                <textarea
                  value={record.treatment_objective}
                  onChange={(e) => handleInputChange('treatment_objective', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="¿Qué se busca lograr con el tratamiento?"
                />
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 mb-2">
                  <Plus size={18} /> Procedimientos Propuestos
                </label>
                {(record.proposed_procedures || EMPTY_RECORD.proposed_procedures).map((proc, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleProcedureChange(index, 'name', e.target.value)}
                      placeholder="Procedimiento"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeProcedure(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addProcedure}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={16} />
                  Agregar Procedimiento
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Costo Estimado
                </label>
                <input
                  type="number"
                  value={record.estimated_cost}
                  onChange={(e) => handleInputChange('estimated_cost', e.target.value)}
                  placeholder="Ej: 1500"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 7: Consents */}
          {currentStep === 7 && (
            <div className="space-y-4">
              {Object.entries(CONSENT_LIBRARY).map(([key, consent]) => (
                <div key={key} className="border-2 border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={consents[key]}
                      onChange={(e) => setConsents(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor={key} className="font-medium text-slate-900 cursor-pointer">
                        {consent.title}
                      </label>
                      <p className="text-sm text-slate-600 mt-1">{consent.short}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                          Leer más
                        </summary>
                        <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded">
                          {consent.content}
                        </p>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 8: Summary */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-900 font-medium">✓ Expediente completado</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Resumen Clínico
                </label>
                <textarea
                  value={record.note_summary}
                  onChange={(e) => handleInputChange('note_summary', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Resumen general del expediente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-slate-600">Diagnóstico: {record.primary_diagnosis || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-slate-600">Costo: ${record.estimated_cost || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>

          <div className="text-sm text-slate-600">
            Paso {currentStep} de {STEPS.length}
          </div>

          {currentStep === STEPS.length ? (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              {saving ? 'Guardando...' : 'Finalizar y guardar'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
