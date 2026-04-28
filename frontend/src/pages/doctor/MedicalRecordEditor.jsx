import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import Swal from 'sweetalert2';
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
  X
} from 'lucide-react';

const CONSENT_LIBRARY = {
  DATA_PRIVACY: {
    title: 'Consentimiento para tratamiento de datos personales sensibles',
    short: 'Autorizo el tratamiento de mis datos personales y sensibles para fines de atencion odontologica, expediente clinico, seguimiento y cumplimiento legal.',
    content:
      'Yo, [nombre completo del paciente o representante], manifiesto que se me informo el aviso de privacidad y otorgo mi consentimiento expreso para el tratamiento de mis datos personales y datos personales sensibles, incluyendo datos de salud, antecedentes clinicos, diagnosticos, imagenes clinicas, radiografias, fotografias, recetas, notas medicas y demas informacion necesaria para mi atencion odontologica, integracion y conservacion de mi expediente clinico, gestion de citas, seguimiento, facturacion y cumplimiento de obligaciones legales. Entiendo que puedo revocar este consentimiento en los casos legalmente procedentes, sin efectos retroactivos sobre tratamientos ya realizados ni sobre informacion que deba conservarse por obligacion legal.',
    signature_type: 'CLICK_WRAP'
  },
  DENTAL_TREATMENT: {
    title: 'Consentimiento para atencion odontologica',
    short: 'Autorizo la valoracion, diagnostico y tratamiento odontologico conforme al plan explicado, incluyendo riesgos, alternativas y cuidados posteriores.',
    content:
      'Yo, [nombre completo], declaro que se me explico de manera clara mi estado de salud bucal, el diagnostico presuntivo o definitivo, el plan de tratamiento propuesto, los riesgos previsibles, las alternativas terapeuticas, las consecuencias de no realizar el tratamiento y los cuidados posteriores. Otorgo mi consentimiento para la realizacion de los procedimientos odontologicos descritos en mi plan de tratamiento, autorizando al personal profesional competente a efectuar los actos necesarios dentro del alcance acordado y conforme a la lex artis, entendiendo que pueden presentarse complicaciones inherentes al tratamiento, a mi estado general de salud o a factores no previsibles.',
    signature_type: 'CLICK_WRAP'
  },
  WHATSAPP: {
    title: 'Consentimiento para uso de WhatsApp o medios electronicos',
    short: 'Autorizo el uso de WhatsApp, SMS, correo electronico o medios equivalentes para citas, recordatorios, indicaciones y seguimiento.',
    content:
      'Autorizo expresamente a [nombre de la clinica] a contactarme por medios electronicos, incluyendo WhatsApp, SMS, llamada telefonica, correo electronico o plataformas equivalentes, para fines de agendado, recordatorios de cita, envio de indicaciones, seguimiento clinico, confirmaciones administrativas y comunicacion relacionada con mi atencion. Entiendo que dichos medios pueden no ser totalmente inviolables y acepto el uso de estos canales bajo medidas razonables de seguridad y confidencialidad. Puedo retirar esta autorizacion en cualquier momento, sin afectar comunicaciones necesarias para obligaciones legales o atencion en curso.',
    signature_type: 'CLICK_WRAP'
  }
};

const TOOTH_STATUS_OPTIONS = [
  'NORMAL',
  'CARIES',
  'RESTORED',
  'ENDODONTIC_TREATMENT',
  'EXTRACTED',
  'MISSING',
  'CROWN',
  'IMPLANT',
  'SEALANT',
  'FRACTURE',
  'PERIODONTAL_FINDING'
];

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
  tooth_entries: [{ tooth_number: '', status: '', surfaces: '', finding_text: '', treatment_text: '' }],
  close_record: false,
};

const EMPTY_CONSENTS = Object.keys(CONSENT_LIBRARY).reduce((acc, key) => {
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

const cloneEmptyRecord = () => ({
  ...EMPTY_RECORD,
  proposed_procedures: [{ name: '', tooth: '', code: '' }],
  tooth_entries: [{ tooth_number: '', status: '', surfaces: '', finding_text: '', treatment_text: '' }],
});

const parseLines = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => `${item}`.trim()).filter(Boolean);
  return `${value}`
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const normalizeProcedureList = (value) => {
  if (!Array.isArray(value) || value.length === 0) return [{ name: '', tooth: '', code: '' }];
  return value.map((item) => ({
    name: item?.name || '',
    tooth: item?.tooth || item?.tooth_number || '',
    code: item?.code || '',
  }));
};

const normalizeToothEntries = (value) => {
  if (!value) return [{ tooth_number: '', status: '', surfaces: '', finding_text: '', treatment_text: '' }];
  if (Array.isArray(value)) {
    return value.map((item) => ({
      tooth_number: item?.tooth_number || item?.toothNumber || '',
      status: item?.status || '',
      surfaces: Array.isArray(item?.surfaces) ? item.surfaces.join(', ') : (item?.surfaces || ''),
      finding_text: item?.finding_text || item?.notes || '',
      treatment_text: item?.treatment_text || '',
    }));
  }
  return Object.entries(value).map(([tooth, item]) => ({
    tooth_number: tooth,
    status: item?.status || '',
    surfaces: Array.isArray(item?.surfaces) ? item.surfaces.join(', ') : (item?.surfaces || ''),
    finding_text: item?.notes || item?.finding_text || '',
    treatment_text: item?.treatment_text || '',
  }));
};

const buildToothData = (entries) => {
  return entries.reduce((acc, entry) => {
    const toothNumber = `${entry.tooth_number || ''}`.trim();
    const status = `${entry.status || ''}`.trim();
    const findingText = `${entry.finding_text || ''}`.trim();
    const treatmentText = `${entry.treatment_text || ''}`.trim();
    const surfaces = parseLines(entry.surfaces).map((surface) => surface.toUpperCase());

    if (!toothNumber && !status && !findingText && !treatmentText) return acc;

    acc[toothNumber || `TOOTH_${Object.keys(acc).length + 1}`] = {
      status: status || 'NORMAL',
      surfaces,
      notes: findingText,
      treatment_text: treatmentText || null,
    };

    return acc;
  }, {});
};

const splitDiagnoses = (value) => parseLines(value);

const extractLatestConsentState = (consents) => {
  const next = JSON.parse(JSON.stringify(EMPTY_CONSENTS));
  (consents || []).forEach((consent) => {
    const key = consent.consent_type;
    if (!next[key]) return;
    if (!next[key].version || consent.version >= next[key].version) {
      next[key] = {
        accepted: consent.accepted,
        title: consent.title || next[key].title,
        content: consent.content || next[key].content,
        signature_type: consent.signature_type || next[key].signature_type,
        version: consent.version || 0,
        latestAcceptedAt: consent.accepted_at || null,
      };
    }
  });
  return next;
};

const hydrateRecord = (recordData) => {
  const sections = recordData?.sections || {};
  const history = sections.history || {};
  const interview = sections.interview || {};
  const exploration = sections.exploration || {};
  const diagnosis = sections.diagnosis || {};
  const plan = sections.plan || {};
  const odontogram = sections.odontogram || {};

  const nextState = cloneEmptyRecord();

  nextState.family_history = history.family_history || recordData?.family_history || '';
  nextState.pathological_history = history.pathological_history || recordData?.pathological_history || '';
  nextState.non_pathological_history = history.non_pathological_history || recordData?.non_pathological_history || '';
  nextState.allergies = history.allergies || recordData?.allergies || '';
  nextState.surgeries = history.surgeries || recordData?.surgeries || '';
  nextState.current_medications = history.current_medications || recordData?.current_medications || '';
  nextState.dental_history = history.dental_history || recordData?.dental_history || '';
  nextState.brushing_frequency = history.brushing_frequency || recordData?.brushing_frequency || '';
  nextState.use_floss = typeof history.use_floss === 'boolean' ? history.use_floss : Boolean(recordData?.use_floss);

  nextState.chief_complaint = interview.chief_complaint || '';
  nextState.symptoms_start_date = formatDateInput(interview.symptoms_start_date);
  nextState.pain_presence = typeof interview.pain_presence === 'boolean' ? interview.pain_presence : false;
  nextState.pain_intensity = interview.pain_intensity ?? '';
  nextState.pain_character = interview.pain_character || '';
  nextState.pain_location = interview.pain_location || '';
  nextState.pain_triggers = interview.pain_triggers || '';
  nextState.pain_relief = interview.pain_relief || '';
  nextState.review_of_systems = interview.review_of_systems || '';

  nextState.extraoral_exam = exploration.extraoral_exam || '';
  nextState.intraoral_exam = exploration.intraoral_exam || '';
  nextState.periodontal_status = exploration.periodontal_status || '';
  nextState.radiographic_findings = exploration.radiographic_findings || '';

  nextState.primary_diagnosis = diagnosis.primary_diagnosis || recordData?.diagnosis || '';
  nextState.secondary_diagnoses = Array.isArray(diagnosis.secondary_diagnoses)
    ? diagnosis.secondary_diagnoses.join('\n')
    : (recordData?.secondary_diagnoses || '');
  nextState.icd10_code = diagnosis.icd10_code || '';
  nextState.diagnostic_basis = diagnosis.diagnostic_basis || '';

  nextState.treatment_objective = plan.treatment_objective || '';
  nextState.proposed_procedures = normalizeProcedureList(plan.proposed_procedures || recordData?.proposed_procedures || []);
  nextState.treatment_plan = plan.treatment_plan || recordData?.treatment_plan || '';
  nextState.risks_explained = plan.risks_explained || '';
  nextState.alternatives_explained = plan.alternatives_explained || '';
  nextState.follow_up_plan = plan.follow_up_plan || '';
  nextState.estimated_cost = plan.estimated_cost ?? '';
  nextState.note_summary = recordData?.clinical_notes?.note_summary || '';

  nextState.tooth_entries = normalizeToothEntries(odontogram.tooth_data || recordData?.tooth_data || recordData?.odontogram || []);
  nextState.close_record = recordData?.status === 'CLOSED';

  return nextState;
};

const SectionCard = ({ title, icon: Icon, accent = 'slate', children, subtitle, className = '' }) => {
  const tone = {
    slate: 'border-slate-200 bg-white',
    emerald: 'border-emerald-200 bg-emerald-50/70',
    rose: 'border-rose-200 bg-rose-50/70',
    amber: 'border-amber-200 bg-amber-50/70',
  }[accent] || 'border-slate-200 bg-white';

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${tone} ${className}`}>
      <div className="bg-white/80 px-6 py-4 border-b border-black/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${accent === 'emerald' ? 'bg-emerald-100' : accent === 'rose' ? 'bg-rose-100' : accent === 'amber' ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <Icon className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-slate-900">{title}</h3>
            {subtitle ? <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = 'text', textarea = false, select = false, options = [], placeholder = '', required = false, helpText = '', rows = 4, className = '' }) => {
  const base = 'w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20 bg-white';
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 pl-1">
        {label}{required ? ' *' : ''}
      </label>
      {type === 'checkbox' ? (
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
          <input
            name={name}
            type="checkbox"
            checked={Boolean(value)}
            onChange={onChange}
            className="w-5 h-5 accent-slate-900"
          />
          <span>{placeholder || 'Activar'}</span>
        </label>
      ) : textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          style={{ minHeight: `${rows * 24}px` }}
          className={base}
        />
      ) : select ? (
        <select name={name} value={value} onChange={onChange} className={base}>
          <option value="">Selecciona...</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={base}
        />
      )}
      {helpText ? <p className="text-[11px] text-slate-400 pl-1">{helpText}</p> : null}
    </div>
  );
};

const ConsentCard = ({ type, draft, onToggle }) => {
  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-sm ${draft.accepted ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">{draft.title}</h4>
          <p className="text-sm text-slate-600 mt-2 leading-6">{draft.content}</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Acepto</span>
          <input
            type="checkbox"
            checked={draft.accepted}
            onChange={(e) => onToggle(type, e.target.checked)}
            className="w-5 h-5 accent-slate-900"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">
        <span>{draft.accepted ? 'Consentimiento activo' : 'Consentimiento pendiente'}</span>
        <span>Firma: {draft.signature_type}</span>
      </div>
    </div>
  );
};

export default function MedicalRecordEditor() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [activeClinic, setActiveClinic] = useState(null);
  const [recordMeta, setRecordMeta] = useState({ latestVersion: null, status: 'DRAFT' });
  const [recordHistory, setRecordHistory] = useState({ versions: [], note_versions: [], odontograms: [], audit_logs: [] });
  const [prescriptionsHistory, setPrescriptionsHistory] = useState([]);
  const [consentDrafts, setConsentDrafts] = useState(EMPTY_CONSENTS);
  const [baselineConsents, setBaselineConsents] = useState(EMPTY_CONSENTS);
  const [form, setForm] = useState(cloneEmptyRecord());
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [prescInstructions, setPrescInstructions] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [sessionPrice, setSessionPrice] = useState('500');

  useEffect(() => {
    fetchData();
    fetchClinics();
  }, [patientId]);

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinics/my');
      if (res.data.data?.length > 0) setActiveClinic(res.data.data[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientRes, recordRes, prescriptionsRes, historyRes, consentsRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/medical-records/${patientId}`),
        api.get(`/prescriptions/patient/${patientId}`),
        api.get(`/medical-records/${patientId}/history`),
        api.get(`/medical-records/${patientId}/consents`)
      ]);

      setPatient(patientRes.data.data);
      setForm(hydrateRecord(recordRes.data.data));
      setRecordMeta({
        latestVersion: recordRes.data.data?.latest_version || null,
        status: recordRes.data.data?.status || 'DRAFT'
      });
      setRecordHistory(historyRes.data.data || { versions: [], note_versions: [], odontograms: [], audit_logs: [] });
      setPrescriptionsHistory(prescriptionsRes.data.data || []);
      const latestConsents = extractLatestConsentState(consentsRes.data.data || []);
      setConsentDrafts(latestConsents);
      setBaselineConsents(latestConsents);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar el expediente',
        text: error.response?.data?.message || 'Intenta recargar la pantalla.',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleConsentToggle = (type, accepted) => {
    setConsentDrafts((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        accepted,
      }
    }));
  };

  const addProcedure = () => {
    setForm((prev) => ({
      ...prev,
      proposed_procedures: [...prev.proposed_procedures, { name: '', tooth: '', code: '' }]
    }));
  };

  const updateProcedure = (index, field, value) => {
    setForm((prev) => {
      const proposed_procedures = [...prev.proposed_procedures];
      proposed_procedures[index] = { ...proposed_procedures[index], [field]: value };
      return { ...prev, proposed_procedures };
    });
  };

  const removeProcedure = (index) => {
    setForm((prev) => ({
      ...prev,
      proposed_procedures: prev.proposed_procedures.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const addToothRow = () => {
    setForm((prev) => ({
      ...prev,
      tooth_entries: [...prev.tooth_entries, { tooth_number: '', status: '', surfaces: '', finding_text: '', treatment_text: '' }]
    }));
  };

  const updateToothRow = (index, field, value) => {
    setForm((prev) => {
      const tooth_entries = [...prev.tooth_entries];
      tooth_entries[index] = { ...tooth_entries[index], [field]: value };
      return { ...prev, tooth_entries };
    });
  };

  const removeToothRow = (index) => {
    setForm((prev) => ({
      ...prev,
      tooth_entries: prev.tooth_entries.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleMedChange = (index, field, value) => {
    setMedications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmitPrescription = async () => {
    try {
      if (medications.some((m) => !m.name.trim())) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos incompletos',
          text: 'Por favor agrega el nombre del medicamento.',
          confirmButtonColor: '#0f172a'
        });
        return;
      }

      await api.post(`/prescriptions/patient/${patientId}`, {
        appointment_id: appointmentId,
        medications,
        instructions: prescInstructions
      });

      setShowPrescriptionModal(false);
      setMedications([{ name: '', dose: '', frequency: '', duration: '' }]);
      setPrescInstructions('');
      await Swal.fire({
        icon: 'success',
        title: 'Receta generada',
        text: 'La receta se emitió correctamente y está lista para imprimir.',
        confirmButtonColor: '#0f172a'
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo generar la receta electrónica.',
        confirmButtonColor: '#0f172a'
      });
    }
  };

  const handlePrint = (p) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const branding = p.appointment?.clinic || activeClinic;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recetario Digital - Rx</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { max-height: 80px; max-width: 250px; object-fit: contain; }
            .clinic-info { text-align: right; }
            .clinic-name { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .clinic-detail { font-size: 10px; color: #64748b; font-weight: 700; margin: 2px 0; }
            .doctor-name { font-size: 24px; font-weight: 900; margin: 0; }
            .doctor-spec { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; }
            .patient-box { background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .patient-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
            .patient-value { font-size: 16px; font-weight: 900; font-style: italic; margin: 0; }
            .rx-title { font-size: 60px; font-family: serif; color: #f1f5f9; position: absolute; font-style: italic; margin-top: -20px; z-index: -1; }
            .med-list { margin-top: 30px; min-height: 400px; }
            .med-item { border-bottom: 1px solid #f1f5f9; padding: 15px 0; }
            .med-name { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .med-dose { font-size: 13px; color: #334155; margin-top: 4px; }
            .instructions { margin-top: 40px; padding: 20px; border: 2px dashed #f1f5f9; border-radius: 15px; background: #fdfdfd; }
            .footer { margin-top: 50px; border-top: 2px solid #0f172a; padding-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature-area { width: 250px; text-align: center; }
            .signature-img { max-height: 90px; margin-bottom: 10px; mix-blend-mode: multiply; }
            .signature-line { border-top: 2px solid #0f172a; padding-top: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${branding?.logo_url ? `<img src="${branding.logo_url}" class="logo" />` : '<div class="clinic-name">DentalCare</div>'}
            <div class="clinic-info">
              <p class="clinic-name">${branding?.name || 'DentalCare'}</p>
              <p class="clinic-detail">${branding?.address || 'Dirección no disponible'}</p>
              <p class="clinic-detail">${branding?.phone ? `Tel: ${branding.phone}` : ''}</p>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <p class="doctor-name">Dr. ${p.doctor.first_name} ${p.doctor.last_name}</p>
            <span class="doctor-spec">${p.doctor.specialty || 'Cirujano Dentista'}</span>
            <p style="font-size: 10px; font-weight: bold; color: #94a3b8; margin: 5px 0;">Cédula Profesional: <span style="color:#0f172a">${p.doctor.license_number || '---'}</span></p>
          </div>

          <div class="patient-box">
            <div>
              <p class="patient-label">Paciente</p>
              <p class="patient-value">${p.patient.first_name} ${p.patient.last_name}</p>
            </div>
            <div style="text-align: right">
              <p class="patient-label">Fecha de Emisión</p>
              <p class="patient-value">${new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div class="med-list">
            <div class="rx-title">Rx</div>
            ${p.medications.map((m) => `
              <div class="med-item">
                <p class="med-name">${m.name}</p>
                <p class="med-dose">${m.dose} • Cada ${m.frequency} • Por ${m.duration}</p>
              </div>
            `).join('')}
            ${p.instructions ? `
              <div class="instructions">
                <p class="patient-label">Indicaciones Complementarias</p>
                <p style="font-size: 14px; font-weight: 700; font-style: italic;">"${p.instructions}"</p>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <div style="font-size: 8px; color: #cbd5e1; font-family: monospace;">UUID: ${p.id.toUpperCase()}</div>
            <div class="signature-area">
              ${p.doctor.signature_stamp_url ? `<img src="${p.doctor.signature_stamp_url}" class="signature-img" />` : '<div style="height: 90px;"></div>'}
              <div class="signature-line">Firma y Sello</div>
            </div>
          </div>

          <script>
            window.onload = () => {
              const images = Array.from(document.getElementsByTagName('img'));
              const promises = images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              });
              Promise.all(promises).then(() => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 250);
              });
            };
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.addEventListener('afterprint', () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 500);
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        family_history: form.family_history,
        pathological_history: form.pathological_history,
        non_pathological_history: form.non_pathological_history,
        allergies: form.allergies,
        surgeries: form.surgeries,
        current_medications: form.current_medications,
        dental_history: form.dental_history,
        brushing_frequency: form.brushing_frequency,
        use_floss: form.use_floss,
        chief_complaint: form.chief_complaint,
        symptoms_start_date: form.symptoms_start_date || null,
        pain_presence: form.pain_presence,
        pain_intensity: form.pain_intensity === '' ? null : Number(form.pain_intensity),
        pain_character: form.pain_character,
        pain_location: form.pain_location,
        pain_triggers: form.pain_triggers,
        pain_relief: form.pain_relief,
        review_of_systems: form.review_of_systems,
        extraoral_exam: form.extraoral_exam,
        intraoral_exam: form.intraoral_exam,
        periodontal_status: form.periodontal_status,
        radiographic_findings: form.radiographic_findings,
        primary_diagnosis: form.primary_diagnosis,
        diagnosis: form.primary_diagnosis,
        secondary_diagnoses: splitDiagnoses(form.secondary_diagnoses),
        icd10_code: form.icd10_code,
        diagnostic_basis: form.diagnostic_basis,
        treatment_objective: form.treatment_objective,
        proposed_procedures: form.proposed_procedures.filter((item) => item.name.trim()),
        treatment_plan: form.treatment_plan,
        risks_explained: form.risks_explained,
        alternatives_explained: form.alternatives_explained,
        follow_up_plan: form.follow_up_plan,
        estimated_cost: form.estimated_cost === '' ? null : Number(form.estimated_cost),
        note_summary: form.note_summary || sessionNote,
        tooth_data: buildToothData(form.tooth_entries),
        close_record: form.close_record,
      };

      await api.patch(`/medical-records/${patientId}`, payload);

      if (appointmentId && sessionNote.trim()) {
        await api.post(`/medical-records/${patientId}/notes`, {
          content: sessionNote,
          appointment_id: appointmentId,
          note_type: 'CONSULTATION'
        });

        await api.patch(`/appointments/${appointmentId}/status`, {
          status: 'IN_PROGRESS',
          total_amount: parseFloat(sessionPrice || '0')
        });
      }

      const consentEntries = Object.keys(consentDrafts).filter((key) => {
        const current = consentDrafts[key];
        const baseline = baselineConsents[key];
        return current.accepted !== baseline.accepted || current.version !== baseline.version;
      });

      for (const consentType of consentEntries) {
        const draft = consentDrafts[consentType];
        await api.post(`/medical-records/${patientId}/consents`, {
          consent_type: consentType,
          title: draft.title,
          content: draft.content,
          accepted: draft.accepted,
          signature_type: draft.signature_type,
          language: 'es_MX',
          revoked: baselineConsents[consentType].accepted && !draft.accepted,
          revoked_reason: baselineConsents[consentType].accepted && !draft.accepted ? 'Revocado desde la interfaz clínica' : null,
        });
      }

      await Swal.fire({
        icon: 'success',
        title: appointmentId ? 'Consulta registrada' : 'Cambios guardados',
        text: appointmentId
          ? 'Se guardó el expediente, la nota de evolución y los consentimientos requeridos.'
          : 'El expediente clínico fue actualizado correctamente.',
        confirmButtonColor: '#0f172a'
      });

      await fetchData();

      if (appointmentId && sessionNote.trim()) {
        navigate('/doctor/schedule');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.response?.data?.message || 'No se pudieron sincronizar los cambios.',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-slate-900 animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando expediente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-slate-900/5">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-200">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {patient?.first_name} {patient?.last_name}
            </h1>
            <div className="flex items-center mt-2 space-x-4 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 w-fit px-3 py-1 rounded">
              <span className="flex items-center"><Activity className="w-3 h-3 mr-1.5" /> {patient?.gender || 'N/R'}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" />
                {patient?.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A'} años
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center"><Lock className="w-3 h-3 mr-1.5" /> {recordMeta.status}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/doctor/schedule')}
          className="flex items-center text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar edición
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {appointmentId && (
            <SectionCard title="Nota de evolución actual" icon={Stethoscope} accent="emerald" subtitle="Se adjunta junto con la consulta y la cita activa.">
              <div className="space-y-4">
                <textarea
                  className="w-full border-2 border-slate-100 rounded-xl p-5 text-sm outline-none focus:border-slate-900 min-h-[170px] font-medium transition-all shadow-inner bg-slate-50/50"
                  placeholder="Describe hallazgos, procedimientos realizados, evolución y recomendaciones del día..."
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label="Honorarios de sesión"
                    name="sessionPrice"
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(e.target.value)}
                    type="number"
                    placeholder="500"
                    helpText="Se sincroniza con la cita cuando guardes la consulta."
                  />
                  <div className="flex items-center text-[11px] text-slate-500 italic leading-relaxed pt-6">
                    Esta nota se convierte en la evolución clínica de la consulta activa.
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Ficha de identificación" icon={Building2} subtitle="Los datos del paciente son de lectura solamente en esta pantalla.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Nombre completo</div>
                <div className="font-bold">{patient?.first_name} {patient?.last_name}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Contacto</div>
                <div className="font-bold">{patient?.phone || 'No registrado'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Correo</div>
                <div className="font-bold">{patient?.email || 'No registrado'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Contacto de emergencia</div>
                <div className="font-bold">{patient?.emergency_contact || 'No registrado'}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Historia clínica" icon={Clipboard} accent="slate" subtitle="Antecedentes heredofamiliares, patológicos, no patológicos y odontológicos.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Heredofamiliares" name="family_history" value={form.family_history} onChange={handleChange} textarea rows={4} />
              <Field label="Patológicos" name="pathological_history" value={form.pathological_history} onChange={handleChange} textarea rows={4} />
              <Field label="No patológicos" name="non_pathological_history" value={form.non_pathological_history} onChange={handleChange} textarea rows={4} />
              <Field label="Quirúrgicos / hospitalarios" name="surgeries" value={form.surgeries} onChange={handleChange} textarea rows={4} />
              <Field label="Alergias" name="allergies" value={form.allergies} onChange={handleChange} textarea rows={4} required helpText="Campo de alto riesgo clínico." />
              <Field label="Medicación actual" name="current_medications" value={form.current_medications} onChange={handleChange} textarea rows={4} />
              <Field label="Historia dental" name="dental_history" value={form.dental_history} onChange={handleChange} textarea rows={4} />
              <Field label="Frecuencia de cepillado" name="brushing_frequency" value={form.brushing_frequency} onChange={handleChange} placeholder="Ej. 3 veces al día" />
            </div>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 pt-2">
              <input type="checkbox" name="use_floss" checked={form.use_floss} onChange={handleChange} className="w-5 h-5 accent-slate-900" />
              Utiliza hilo dental
            </label>
          </SectionCard>

          <SectionCard title="Interrogatorio" icon={FileText} accent="amber" subtitle="Motivo de consulta, dolor y síntomas relevantes.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Motivo de consulta" name="chief_complaint" value={form.chief_complaint} onChange={handleChange} textarea rows={4} required />
              <Field label="Fecha de inicio de síntomas" name="symptoms_start_date" value={form.symptoms_start_date} onChange={handleChange} type="date" />
              <Field label="Presencia de dolor" name="pain_presence" value={form.pain_presence} onChange={handleChange} type="checkbox" placeholder="Registrar presencia de dolor" />
              <Field label="Intensidad del dolor (0-10)" name="pain_intensity" value={form.pain_intensity} onChange={handleChange} type="number" />
              <Field label="Carácter del dolor" name="pain_character" value={form.pain_character} onChange={handleChange} placeholder="Ej. punzante, sordo, pulsátil" />
              <Field label="Localización" name="pain_location" value={form.pain_location} onChange={handleChange} placeholder="Ej. molar inferior derecho" />
              <Field label="Factores desencadenantes" name="pain_triggers" value={form.pain_triggers} onChange={handleChange} textarea rows={3} />
              <Field label="Alivio" name="pain_relief" value={form.pain_relief} onChange={handleChange} textarea rows={3} />
            </div>
            <Field label="Revisión por sistemas" name="review_of_systems" value={form.review_of_systems} onChange={handleChange} textarea rows={4} />
          </SectionCard>

          <SectionCard title="Exploración clínica" icon={Brush} accent="slate" subtitle="Hallazgos extraorales, intraorales, periodontales y radiográficos.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Exploración extraoral" name="extraoral_exam" value={form.extraoral_exam} onChange={handleChange} textarea rows={4} />
              <Field label="Exploración intraoral" name="intraoral_exam" value={form.intraoral_exam} onChange={handleChange} textarea rows={4} />
              <Field label="Estado periodontal" name="periodontal_status" value={form.periodontal_status} onChange={handleChange} textarea rows={4} />
              <Field label="Hallazgos radiográficos" name="radiographic_findings" value={form.radiographic_findings} onChange={handleChange} textarea rows={4} />
            </div>
          </SectionCard>

          <SectionCard title="Diagnóstico y plan de tratamiento" icon={Crosshair} accent="emerald" subtitle="Debe quedar congruente con la exploración y el consentimiento informado.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Diagnóstico principal" name="primary_diagnosis" value={form.primary_diagnosis} onChange={handleChange} textarea rows={4} required />
              <Field label="Diagnósticos secundarios" name="secondary_diagnoses" value={form.secondary_diagnoses} onChange={handleChange} textarea rows={4} helpText="Uno por línea o separado por comas." />
              <Field label="Código ICD-10" name="icd10_code" value={form.icd10_code} onChange={handleChange} placeholder="Opcional" />
              <Field label="Fundamento diagnóstico" name="diagnostic_basis" value={form.diagnostic_basis} onChange={handleChange} textarea rows={4} />
              <Field label="Objetivo terapéutico" name="treatment_objective" value={form.treatment_objective} onChange={handleChange} textarea rows={4} />
              <Field label="Costo estimado" name="estimated_cost" value={form.estimated_cost} onChange={handleChange} type="number" placeholder="0" />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Procedimientos propuestos</div>
                  <div className="text-[11px] text-slate-400 mt-1">Agrega tratamientos, pieza y código si aplica.</div>
                </div>
                <button type="button" onClick={addProcedure} className="text-[10px] font-black uppercase tracking-[0.18em] px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                  + Agregar procedimiento
                </button>
              </div>
              <div className="space-y-4">
                {form.proposed_procedures.map((procedure, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white rounded-xl border border-slate-200 p-4">
                    <div className="md:col-span-6">
                      <input
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
                        placeholder="Procedimiento"
                        value={procedure.name}
                        onChange={(e) => updateProcedure(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
                        placeholder="Pieza dental"
                        value={procedure.tooth}
                        onChange={(e) => updateProcedure(index, 'tooth', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
                        placeholder="Código"
                        value={procedure.code}
                        onChange={(e) => updateProcedure(index, 'code', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end">
                      {form.proposed_procedures.length > 1 && (
                        <button type="button" onClick={() => removeProcedure(index)} className="text-rose-600 hover:text-rose-700 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <Field label="Plan de tratamiento" name="treatment_plan" value={form.treatment_plan} onChange={handleChange} textarea rows={5} required />
              <Field label="Riesgos explicados" name="risks_explained" value={form.risks_explained} onChange={handleChange} textarea rows={5} required />
              <Field label="Alternativas explicadas" name="alternatives_explained" value={form.alternatives_explained} onChange={handleChange} textarea rows={5} required />
              <Field label="Seguimiento / controles" name="follow_up_plan" value={form.follow_up_plan} onChange={handleChange} textarea rows={5} required />
              <Field label="Resumen clínico del expediente" name="note_summary" value={form.note_summary} onChange={handleChange} textarea rows={4} helpText="Se usa como resumen estructural de la evolución clínica." />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <input type="checkbox" name="close_record" checked={form.close_record} onChange={handleChange} className="w-5 h-5 accent-slate-900" />
                Cerrar expediente al guardar esta versión
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Odontograma" icon={Building2} accent="amber" subtitle="Captura por pieza dental. Se guarda en el expediente como estructura JSON.">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">Puedes capturar una o varias piezas. Si no aplica, deja la sección vacía.</div>
                <button type="button" onClick={addToothRow} className="text-[10px] font-black uppercase tracking-[0.18em] px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                  + Agregar pieza
                </button>
              </div>
              <div className="space-y-4">
                {form.tooth_entries.map((row, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-2">
                        <input className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Pieza" value={row.tooth_number} onChange={(e) => updateToothRow(index, 'tooth_number', e.target.value)} />
                      </div>
                      <div className="md:col-span-3">
                        <select className="w-full border rounded-xl px-4 py-3 text-sm bg-white" value={row.status} onChange={(e) => updateToothRow(index, 'status', e.target.value)}>
                          <option value="">Estado</option>
                          {TOOTH_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-4">
                        <input className="w-full border rounded-xl px-4 py-3 text-sm" placeholder="Superficies (M, O, D...)" value={row.surfaces} onChange={(e) => updateToothRow(index, 'surfaces', e.target.value)} />
                      </div>
                      <div className="md:col-span-3 flex items-center justify-end">
                        {form.tooth_entries.length > 1 && (
                          <button type="button" onClick={() => removeToothRow(index)} className="text-rose-600 hover:text-rose-700 p-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea className="w-full border rounded-xl px-4 py-3 text-sm min-h-[96px]" placeholder="Hallazgo" value={row.finding_text} onChange={(e) => updateToothRow(index, 'finding_text', e.target.value)} />
                      <textarea className="w-full border rounded-xl px-4 py-3 text-sm min-h-[96px]" placeholder="Tratamiento" value={row.treatment_text} onChange={(e) => updateToothRow(index, 'treatment_text', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Consentimientos" icon={ShieldCheck} accent="slate" subtitle="Debes capturar aceptación explícita para datos sensibles, tratamiento y WhatsApp.">
            <div className="grid grid-cols-1 gap-5">
              {Object.keys(CONSENT_LIBRARY).map((type) => (
                <ConsentCard key={type} type={type} draft={consentDrafts[type]} onToggle={handleConsentToggle} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-8">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center text-rose-800 mb-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Alertas médicas y alergias</h3>
            </div>
            <textarea
              name="allergies"
              className="w-full bg-white border border-rose-200 rounded-xl p-4 text-sm font-black text-rose-900 focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px] shadow-inner"
              placeholder="Registrar alergias relevantes..."
              value={form.allergies}
              onChange={handleChange}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center text-slate-900 mb-4">
              <ShieldCheck className="w-5 h-5 mr-3" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Medicación vigente</h3>
            </div>
            <textarea
              name="current_medications"
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 min-h-[100px]"
              placeholder="Tratamientos farmacológicos activos..."
              value={form.current_medications}
              onChange={handleChange}
            />
          </div>

          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center"><Clipboard className="w-4 h-4 mr-2" /> Recetas emitidas</h3>
              <button onClick={() => setShowPrescriptionModal(true)} className="p-1 px-3 text-emerald-400 font-black hover:bg-slate-800 transition-all text-[10px] flex items-center">
                <Plus className="w-3 h-3 mr-1" /> Nueva
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar">
              {prescriptionsHistory.length > 0 ? prescriptionsHistory.map((prescription) => (
                <div key={prescription.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase">{new Date(prescription.created_at).toLocaleDateString('es-MX')}</p>
                    <p className="text-xs font-bold mt-1 text-slate-100">{prescription.medications.length} fórmulas</p>
                  </div>
                  <button onClick={() => handlePrint(prescription)} className="p-3 bg-slate-700 hover:bg-white hover:text-slate-950 rounded-lg transition-all">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-center py-6 text-xs text-slate-600 font-black uppercase tracking-widest italic opacity-50">Sin registros</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center text-slate-900 border-b border-slate-200">
              <Clock className="w-4 h-4 mr-2" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Versiones del expediente</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[260px] overflow-y-auto">
              {recordHistory.versions?.length > 0 ? recordHistory.versions.map((version) => (
                <div key={version.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Versión {version.version_number}</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{version.is_locked ? 'Bloqueada' : 'Borrador'}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-2 line-clamp-2">{version.change_reason || 'Sin motivo registrado'}</p>
                </div>
              )) : (
                <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase">Sin versiones</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center text-slate-900 border-b border-slate-200">
              <Clock className="w-4 h-4 mr-2" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Evolución clínica</h3>
            </div>
            <div className="p-6 space-y-6 max-h-[260px] overflow-y-auto">
              {recordHistory.note_versions?.length > 0 ? recordHistory.note_versions.map((note) => (
                <div key={note.id} className="relative pl-6 border-l-2 border-slate-200 pb-2">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 bg-slate-200 rounded-full" />
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(note.created_at).toLocaleDateString('es-MX', { dateStyle: 'short' })}</p>
                  <p className="text-xs text-slate-600 font-bold line-clamp-3 hover:line-clamp-none cursor-pointer transition-all">{note.content}</p>
                </div>
              )) : (
                <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase">Sin visitas registradas</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center text-slate-900 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Consentimientos</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[260px] overflow-y-auto">
              {Object.keys(CONSENT_LIBRARY).map((type) => (
                <div key={type} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{CONSENT_LIBRARY[type].title}</p>
                    <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${consentDrafts[type].accepted ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {consentDrafts[type].accepted ? 'Activo' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-center space-x-3 hover:bg-black transition-all shadow-2xl font-black text-sm uppercase tracking-[0.3em] disabled:opacity-70"
          >
            <Save className="w-6 h-6" />
            <span>{saving ? 'Sincronizando...' : (appointmentId ? 'Guardar y finalizar' : 'Guardar cambios')}</span>
          </button>
        </div>
      </div>

      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div className="flex items-center space-x-3 text-slate-900">
                <div className="bg-emerald-100 p-2 rounded-xl"><Stethoscope className="w-5 h-5 text-emerald-600" /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Recetario digital</h2>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)} className="bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-all group">
                <X className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Medicamentos / posología</p>
                  <button
                    onClick={() => setMedications([...medications, { name: '', dose: '', frequency: '', duration: '' }])}
                    className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 uppercase tracking-widest transition-all"
                  >
                    + Agregar fármaco
                  </button>
                </div>

                <div className="space-y-6">
                  {medications.map((med, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Medicamento *</label>
                          <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={med.name} onChange={(e) => handleMedChange(idx, 'name', e.target.value)} placeholder="Ej: Ketorolaco 10 mg" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Dosis</label>
                          <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold" value={med.dose} onChange={(e) => handleMedChange(idx, 'dose', e.target.value)} placeholder="Ej: 1 tableta" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Frecuencia</label>
                          <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold" value={med.frequency} onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)} placeholder="Ej: Cada 8 horas" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Duración</label>
                          <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold" value={med.duration} onChange={(e) => handleMedChange(idx, 'duration', e.target.value)} placeholder="Ej: 3 días" />
                        </div>
                      </div>
                      {medications.length > 1 && (
                        <button
                          onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                          className="absolute -right-3 -top-3 bg-rose-500 text-white rounded-full p-2 shadow-xl hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-100">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Indicaciones generales y cuidados</label>
                <textarea className="w-full border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[120px] bg-slate-50/30" placeholder="Evitar exposición al sol, dieta blanda..." value={prescInstructions} onChange={(e) => setPrescInstructions(e.target.value)} />
              </div>

              <div className="flex gap-6 pt-4">
                <button onClick={() => setShowPrescriptionModal(false)} className="flex-1 py-5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button onClick={handleSubmitPrescription} className="flex-1 py-5 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">Generar receta emitida</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
