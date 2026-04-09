import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
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

export default function MedicalRecordEditor() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [record, setRecord] = useState({
    family_history: '',
    pathological_history: '',
    non_pathological_history: '',
    allergies: '',
    surgeries: '',
    current_medications: '',
    dental_history: '',
    brushing_frequency: '',
    use_floss: false,
    diagnosis: '',
    treatment_plan: '',
    notes: []
  });

  const [activeClinic, setActiveClinic] = useState(null);

  // Estado para la consulta actual
  const [sessionNote, setSessionNote] = useState('');
  const [sessionPrice, setSessionPrice] = useState('500');

  // Estado para la Receta
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [prescInstructions, setPrescInstructions] = useState('');
  const [prescriptionsHistory, setPrescriptionsHistory] = useState([]);

  useEffect(() => {
    fetchData();
    fetchClinics();
  }, [patientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientRes, recordRes, prescriptionsRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/medical-records/${patientId}`),
        api.get(`/prescriptions/patient/${patientId}`)
      ]);
      setPatient(patientRes.data.data);
      if (recordRes.data.data) {
        setRecord(recordRes.data.data);
      }
      setPrescriptionsHistory(prescriptionsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinics/my');
      if (res.data.data.length > 0) setActiveClinic(res.data.data[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecord(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      // 1. Guardar expediente base
      await api.patch(`/medical-records/${patientId}`, record);

      // 2. Si hay consulta, guardar nota y cerrar
      if (appointmentId && sessionNote.trim()) {
        await api.post(`/medical-records/${patientId}/notes`, {
          content: sessionNote,
          appointment_id: appointmentId,
          note_type: 'CONSULTATION'
        });

        await api.patch(`/appointments/${appointmentId}/status`, {
          status: 'IN_PROGRESS',
          total_amount: parseFloat(sessionPrice)
        });

        alert('Historial actualizado y consulta finalizada');
        navigate('/doctor/schedule');
      } else {
        alert('Cambios guardados exitosamente');
        fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleMedChange = (index, field, value) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const handleSubmitPrescription = async () => {
    try {
      if (medications.some(m => !m.name.trim())) {
        alert('Por favor agrega el nombre del medicamento');
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
      fetchData();
    } catch (error) {
      alert('Error al generar receta');
    }
  };

  // Estado para la impresión (Fail-safe method)
  const [printData, setPrintData] = useState(null);

  // Función para generar la impresión real (Método Iframe Robusto)
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
    
    // Contenido HTML de la Receta
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
            .signature-img { max-height: 90px; margin-bottom: 10px; mix-blend-multiply; }
            .signature-line { border-top: 2px solid #0f172a; padding-top: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            ${activeClinic?.logo_url ? '<img src="' + activeClinic.logo_url + '" class="logo" />' : '<div class="clinic-name">DentalCare</div>'}
            <div class="clinic-info">
              <p class="clinic-name">${activeClinic?.name || ''}</p>
              <p class="clinic-detail">${activeClinic?.address || ''}</p>
              <p class="clinic-detail">${activeClinic?.phone ? `Tel: ${activeClinic.phone}` : ''}</p>
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
            ${p.medications.map(m => `
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
              ${p.doctor.signature_stamp_url ? '<img src="' + p.doctor.signature_stamp_url + '" class="signature-img" />' : '<div style="height: 90px;"></div>'}
              <div class="signature-line">Firma y Sello</div>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    // Trigger de impresión desde el padre para máxima compatibilidad
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Limpieza diferida
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 800);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Activity className="w-12 h-12 text-slate-900 animate-spin mx-auto" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Expediente...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* 1. Header & Identity */}
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
                 {patient?.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A'} Años
               </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/doctor/schedule')} 
          className="flex items-center text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar Edición
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lado Izquierdo (8/12): Formulario Estructural y Consulta */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* A. NOTA DE CONSULTA (Si aplica) */}
          {appointmentId && (
            <div className="bg-white rounded-2xl border-4 border-slate-900 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="bg-slate-900 px-8 py-4 flex justify-between items-center text-white">
                 <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500 p-1.5 rounded-full"><Stethoscope className="w-4 h-4" /></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Nota de Evolución Actual</h3>
                 </div>
                 <div className="flex items-center space-x-3">
                   <button 
                     onClick={() => setShowPrescriptionModal(true)}
                     className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded font-black text-[9px] uppercase tracking-widest border border-white/20 transition-all"
                   >
                     Generar Receta Rx
                   </button>
                   <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
                 </div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                       <FileText className="w-3 h-3 mr-2" /> Relato Clínico del día *
                    </label>
                    <textarea 
                      className="w-full border-2 border-slate-100 rounded-xl p-6 text-sm outline-none focus:border-slate-900 min-h-[160px] font-medium transition-all shadow-inner bg-slate-50/50"
                      placeholder="Describe los hallazgos, procedimientos realizados y recomendaciones de esta sesión..."
                      value={sessionNote}
                      onChange={(e) => setSessionNote(e.target.value)}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Honorarios de Sesión ($)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                          <input type="number" className="w-full border-2 border-slate-100 rounded-xl pl-8 pr-4 py-3 text-2xl font-black text-slate-900 outline-none focus:border-slate-900" value={sessionPrice} onChange={e => setSessionPrice(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center italic text-slate-400 text-[10px] leading-relaxed">
                       Al finalizar, esta nota se agregará al historial permanente y la cita se marcará como pagada/atendida en el dashboard.
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* B. EXPEDIENTE: ANTECEDENTES (Restauración) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center">
                <Clipboard className="w-4 h-4 text-slate-900 mr-3" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Antecedentes Médicos (Historia Clínica)</h3>
             </div>
             <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Heredofamiliares</label>
                    <textarea name="family_history" className="w-full border border-slate-100 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[120px] bg-slate-50/20" value={record.family_history || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patológicos / Personales</label>
                    <textarea name="pathological_history" className="w-full border border-slate-100 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[120px] bg-slate-50/20" value={record.pathological_history || ''} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Patológicos (Hábitos/Dieta)</label>
                    <textarea name="non_pathological_history" className="w-full border border-slate-100 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] bg-slate-50/20" value={record.non_pathological_history || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quirúrgicos / Hospitalarios</label>
                    <textarea name="surgeries" className="w-full border border-slate-100 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] bg-slate-50/20" value={record.surgeries || ''} onChange={handleChange} />
                  </div>
                </div>
             </div>
          </div>

          {/* C. EXPEDIENTE: INTERROGATORIO ODONTOLÓGICO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center">
                <Brush className="w-4 h-4 text-slate-900 mr-3" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Evaluación Odontológica Inicial</h3>
             </div>
             <div className="p-8 space-y-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo de Consulta e Historia Dental Previa</label>
                  <textarea name="dental_history" className="w-full border border-slate-100 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] bg-slate-50/20" value={record.dental_history || ''} onChange={handleChange} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frecuencia de Higiene (Higiene Oral)</label>
                      <input name="brushing_frequency" className="w-full border border-slate-100 rounded-lg p-3 text-sm font-bold bg-slate-50" placeholder="Ej: 3 veces al día" value={record.brushing_frequency || ''} onChange={handleChange} />
                   </div>
                   <div className="flex items-center space-x-4 pt-6">
                      <input type="checkbox" id="use_floss" name="use_floss" className="w-5 h-5 accent-slate-900 rounded" checked={record.use_floss || false} onChange={handleChange} />
                      <label htmlFor="use_floss" className="text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Utiliza Hilo Dental</label>
                   </div>
                </div>
             </div>
          </div>

          {/* D. EXPEDIENTE: DIAGNÓSTICO Y PLAN GENERAL */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
             <div className="bg-emerald-100 px-8 py-5 border-b border-emerald-200 flex items-center">
                <Crosshair className="w-4 h-4 text-emerald-900 mr-3" />
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Diagnóstico y Plan de Tratamiento Integral</h3>
             </div>
             <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Diagnóstico General</label>
                    <textarea name="diagnosis" className="w-full border border-emerald-200 rounded-lg p-4 text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] bg-white shadow-sm" value={record.diagnosis || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Plan de Tratamiento Sugerido</label>
                    <textarea name="treatment_plan" className="w-full border border-emerald-200 rounded-lg p-4 text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] bg-white shadow-sm" value={record.treatment_plan || ''} onChange={handleChange} />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Lado Derecho (4/12): Alertas + Historiales Dinámicos */}
        <div className="lg:col-span-4 space-y-8 sticky top-8">
           
           {/* 1. Alertas Críticas (Sempre visíveis) */}
           <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center text-rose-800 mb-6">
                 <AlertCircle className="w-5 h-5 mr-3" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Alertas Médicas y Alergias</h3>
              </div>
              <textarea 
                name="allergies"
                className="w-full bg-white border border-rose-200 rounded-xl p-4 text-sm font-black text-rose-900 focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px] shadow-inner"
                placeholder="REGISTRAR ALERGIAS RELEVANTES..."
                value={record.allergies || ''}
                onChange={handleChange}
              />
           </div>

           {/* 2. Medicamentos Actuales */}
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center text-slate-900 mb-6">
                 <ShieldCheck className="w-5 h-5 mr-3" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Medicación Vigente</h3>
              </div>
              <textarea 
                name="current_medications"
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 min-h-[100px]"
                placeholder="Tratamientos farmacológicos activos..."
                value={record.current_medications || ''}
                onChange={handleChange}
              />
           </div>

           {/* 3. Panel de Recetas (Rx History) */}
           <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center"><Clipboard className="w-4 h-4 mr-2" /> Recetas Emitidas</h3>
                 <button onClick={() => setShowPrescriptionModal(true)} className="p-1 px-3 text-emerald-400 font-black hover:bg-slate-800 transition-all text-[10px] flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> NUEVA
                 </button>
              </div>
              <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                 {prescriptionsHistory.length > 0 ? prescriptionsHistory.map(p => (
                   <div key={p.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase">{new Date(p.created_at).toLocaleDateString()}</p>
                        <p className="text-xs font-bold mt-1 text-slate-100">{p.medications.length} Fórmulas</p>
                      </div>
                      <button 
                        onClick={() => handlePrint(p)}
                        className="p-3 bg-slate-700 hover:bg-white hover:text-slate-950 rounded-lg transition-all"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                   </div>
                 )) : (
                   <p className="text-center py-6 text-xs text-slate-600 font-black uppercase tracking-widest italic opacity-50">Sin registros</p>
                 )}
              </div>
           </div>

           {/* 4. Historial de Notas de Evolución */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 flex items-center text-slate-900 border-b border-slate-200">
                 <Clock className="w-4 h-4 mr-2" />
                 <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Registro de Evolución</h3>
              </div>
              <div className="p-6 space-y-6 max-h-[350px] overflow-y-auto">
                 {record.notes?.length > 0 ? record.notes.map(note => (
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

           {/* 5. Acción Global: GUARDAR */}
           <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-center space-x-3 hover:bg-black transition-all shadow-2xl font-black text-sm uppercase tracking-[0.3em]"
           >
             <Save className="w-6 h-6" />
             <span>{saving ? 'Sincronizando...' : (appointmentId ? 'GUARDAR Y FINALIZAR' : 'GUARDAR CAMBIOS')}</span>
           </button>
        </div>
      </div>

      {/* Modal Nueva Receta Rx */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <div className="flex items-center space-x-3 text-slate-900">
                    <div className="bg-emerald-100 p-2 rounded-xl"><Stethoscope className="w-5 h-5 text-emerald-600" /></div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Recetario Digital</h2>
                </div>
                <button onClick={() => setShowPrescriptionModal(false)} className="bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-all group">
                  <X className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
                </button>
             </div>
             
             <div className="p-8 space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Medicamentos / Posología</p>
                    <button 
                      onClick={() => setMedications([...medications, { name: '', dose: '', frequency: '', duration: '' }])} 
                      className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 uppercase tracking-widest transition-all"
                    >
                      + AGREGAR FÁRMACO
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {medications.map((med, idx) => (
                      <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Medicamento *</label>
                              <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-black focus:ring-2 focus:ring-slate-900 outline-none" value={med.name} onChange={(e) => handleMedChange(idx, 'name', e.target.value)} placeholder="Ej: Ketorolaco 10mg" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Dosis</label>
                              <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold" value={med.dose} onChange={(e) => handleMedChange(idx, 'dose', e.target.value)} placeholder="Ej: 1 tableta" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Frecuencia</label>
                              <input className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold" value={med.frequency} onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)} placeholder="Ej: Cada 6-8 horas" />
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
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Indicaciones Generales y Cuidados</label>
                  <textarea className="w-full border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none min-h-[120px] bg-slate-50/30" placeholder="Evitar exposición al sol, dieta blanda..." value={prescInstructions} onChange={(e) => setPrescInstructions(e.target.value)} />
                </div>

                <div className="flex gap-6 pt-4">
                   <button onClick={() => setShowPrescriptionModal(false)} className="flex-1 py-5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                   <button onClick={handleSubmitPrescription} className="flex-1 py-5 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">GENERAR RECETA EMITIDA</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
