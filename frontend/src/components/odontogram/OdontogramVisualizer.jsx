import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Save,
  Shield,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'SANO', label: 'Sano', color: '#16a34a' },
  { value: 'CARIES', label: 'Caries', color: '#ef4444' },
  { value: 'RESTAURACION', label: 'Restauración', color: '#2563eb' },
  { value: 'AUSENTE', label: 'Ausente', color: '#64748b' },
  { value: 'ENDODONCIA', label: 'Endodoncia', color: '#7c3aed' },
  { value: 'CORONA', label: 'Corona', color: '#b45309' },
  { value: 'OTRO', label: 'Otro', color: '#0f172a' },
];

const STATUS_ALIASES = {
  NORMAL: 'SANO',
  HEALTHY: 'SANO',
  SANO: 'SANO',
  CARIES: 'CARIES',
  RESTORED: 'RESTAURACION',
  RESTAURADO: 'RESTAURACION',
  RESTAURACION: 'RESTAURACION',
  EXTRACTED: 'AUSENTE',
  MISSING: 'AUSENTE',
  AUSENTE: 'AUSENTE',
  ENDODONTIC_TREATMENT: 'ENDODONCIA',
  ENDODONCIA: 'ENDODONCIA',
  CROWN: 'CORONA',
  CORONA: 'CORONA',
  OTHER: 'OTRO',
  OTRO: 'OTRO',
};

const QUADRANTS = [
  {
    key: 'Q1',
    title: 'Cuadrante 1',
    subtitle: 'Superior derecho',
    teeth: [18, 17, 16, 15, 14, 13, 12, 11],
    x: 28,
    y: 70,
  },
  {
    key: 'Q2',
    title: 'Cuadrante 2',
    subtitle: 'Superior izquierdo',
    teeth: [21, 22, 23, 24, 25, 26, 27, 28],
    x: 602,
    y: 70,
  },
  {
    key: 'Q4',
    title: 'Cuadrante 4',
    subtitle: 'Inferior derecho',
    teeth: [48, 47, 46, 45, 44, 43, 42, 41],
    x: 28,
    y: 310,
  },
  {
    key: 'Q3',
    title: 'Cuadrante 3',
    subtitle: 'Inferior izquierdo',
    teeth: [31, 32, 33, 34, 35, 36, 37, 38],
    x: 602,
    y: 310,
  },
];

const EMPTY_DRAFT = {
  patient_id: null,
  tooth_number: '',
  status: 'SANO',
  custom_status: '',
  treatment: '',
  notes: '',
  surfaces: '',
  date: '',
  created_by: null,
};

const formatDateTimeLocal = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseDateSafe = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const normalizeStatus = (value) => STATUS_ALIASES[String(value || '').toUpperCase()] || 'OTRO';

const normalizeEntry = (entry, fallbackPatientId = null, fallbackCreatedBy = null) => ({
  patient_id: entry?.patient_id || fallbackPatientId || null,
  tooth_number: `${entry?.tooth_number || entry?.toothNumber || ''}`.trim(),
  status: normalizeStatus(entry?.status),
  custom_status: `${entry?.custom_status || entry?.customStatus || ''}`.trim(),
  treatment: `${entry?.treatment || entry?.treatment_text || ''}`.trim(),
  notes: `${entry?.notes || entry?.finding_text || entry?.note || ''}`.trim(),
  surfaces: `${entry?.surfaces || ''}`.trim(),
  date: formatDateTimeLocal(parseDateSafe(entry?.date || entry?.created_at || new Date())),
  created_by: entry?.created_by || fallbackCreatedBy || null,
});

export const normalizeOdontogramRecords = (value, fallbackPatientId = null, fallbackCreatedBy = null) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeEntry(item, fallbackPatientId, fallbackCreatedBy))
      .filter((item) => item.tooth_number);
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([toothNumber, item]) => {
        if (Array.isArray(item)) {
          return item.map((entry) => normalizeEntry({ tooth_number: toothNumber, ...entry }, fallbackPatientId, fallbackCreatedBy));
        }

        if (item && typeof item === 'object' && Array.isArray(item.history)) {
          return item.history.map((entry) => normalizeEntry({ tooth_number: toothNumber, ...entry }, fallbackPatientId, fallbackCreatedBy));
        }

        return [normalizeEntry({ tooth_number: toothNumber, ...(item || {}) }, fallbackPatientId, fallbackCreatedBy)];
      })
      .filter((item) => item.tooth_number);
  }

  return [];
};

const getLatestRecordByTooth = (records) => {
  return records.reduce((acc, entry) => {
    if (!entry?.tooth_number) return acc;
    const current = acc[entry.tooth_number];
    if (!current) {
      acc[entry.tooth_number] = entry;
      return acc;
    }

    const currentTime = parseDateSafe(current.date).getTime();
    const nextTime = parseDateSafe(entry.date).getTime();
    if (nextTime >= currentTime) {
      acc[entry.tooth_number] = entry;
    }
    return acc;
  }, {});
};

const groupHistoryByTooth = (records) => {
  return records.reduce((acc, entry) => {
    if (!entry?.tooth_number) return acc;
    if (!acc[entry.tooth_number]) acc[entry.tooth_number] = [];
    acc[entry.tooth_number].push(entry);
    return acc;
  }, {});
};

const getStatusMeta = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_OPTIONS.find((item) => item.value === normalized) || STATUS_OPTIONS[STATUS_OPTIONS.length - 1];
};

const createEmptyDraft = (toothNumber, patientId = null, createdBy = null) => ({
  ...EMPTY_DRAFT,
  patient_id: patientId,
  tooth_number: `${toothNumber || ''}`,
  created_by: createdBy || null,
  date: formatDateTimeLocal(),
  status: 'SANO',
});

const ToothButton = ({ toothNumber, record, onClick, selected }) => {
  const statusMeta = getStatusMeta(record?.status);
  const label = record?.custom_status || statusMeta.label;
  const hasTreatment = Boolean(record?.treatment || record?.notes);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 ${selected ? 'border-slate-900 bg-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-md'}`}
      aria-label={`Diente ${toothNumber}`}
      title={`Diente ${toothNumber} - ${label}`}
    >
      <svg viewBox="0 0 84 84" className="h-16 w-16 sm:h-18 sm:w-18" aria-hidden="true">
        <circle cx="42" cy="42" r="34" fill="#f8fafc" stroke={selected ? '#0f172a' : statusMeta.color} strokeWidth="3" />
        <circle cx="42" cy="42" r="24" fill={statusMeta.color} fillOpacity={record ? '0.12' : '0.04'} stroke="none" />
        {hasTreatment ? <circle cx="42" cy="42" r="10" fill={statusMeta.color} fillOpacity="0.85" /> : null}
        <text x="42" y="49" textAnchor="middle" className="fill-slate-900" fontSize="18" fontWeight="800">
          {toothNumber}
        </text>
      </svg>
      <div className="mt-1 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-900">{toothNumber}</div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
          <span className="max-w-[64px] truncate">{label}</span>
        </div>
      </div>
      {hasTreatment ? (
        <div className="absolute right-2 top-2 rounded-full bg-slate-900 p-1 text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
        </div>
      ) : null}
    </button>
  );
};

export default function OdontogramVisualizer({
  value = [],
  onChange,
  patientId = null,
  createdBy = null,
  title = 'Odontograma Visual',
  subtitle = 'Representación FDI con historial por diente y estados clínicos.',
  readOnly = false,
}) {
  const [records, setRecords] = useState(() => normalizeOdontogramRecords(value, patientId, createdBy));
  const [selectedTooth, setSelectedTooth] = useState('11');
  const [draft, setDraft] = useState(() => createEmptyDraft('11', patientId, createdBy));

  useEffect(() => {
    const normalized = normalizeOdontogramRecords(value, patientId, createdBy);
    setRecords(normalized);
    if (normalized.length > 0 && !normalized.some((item) => item.tooth_number === selectedTooth)) {
      setSelectedTooth(normalized[normalized.length - 1].tooth_number);
    }
  }, [value, patientId, createdBy]);

  const historyByTooth = useMemo(() => groupHistoryByTooth(records), [records]);
  const latestByTooth = useMemo(() => getLatestRecordByTooth(records), [records]);
  const selectedHistory = historyByTooth[selectedTooth] || [];
  const selectedLatest = latestByTooth[selectedTooth] || null;

  useEffect(() => {
    const base = selectedLatest || createEmptyDraft(selectedTooth, patientId, createdBy);
    setDraft({
      ...createEmptyDraft(selectedTooth, patientId, createdBy),
      ...base,
      date: base?.date || formatDateTimeLocal(),
    });
  }, [selectedTooth, selectedLatest, patientId, createdBy]);

  const totalTeethWithHistory = Object.keys(historyByTooth).length;
  const totalRecords = records.length;

  const handleSelectTooth = (toothNumber) => {
    setSelectedTooth(`${toothNumber}`);
  };

  const handleSave = () => {
    if (readOnly) return;

    const nextEntry = {
      patient_id: patientId,
      tooth_number: `${draft.tooth_number || selectedTooth}`,
      status: normalizeStatus(draft.status),
      custom_status: draft.status === 'OTRO' ? `${draft.custom_status || ''}`.trim() : '',
      treatment: `${draft.treatment || ''}`.trim(),
      notes: `${draft.notes || ''}`.trim(),
      surfaces: `${draft.surfaces || ''}`.trim(),
      date: formatDateTimeLocal(parseDateSafe(draft.date)),
      created_by: createdBy || draft.created_by || null,
    };

    const nextRecords = [...records, nextEntry];
    setRecords(nextRecords);
    onChange?.(nextRecords);
    setSelectedTooth(nextEntry.tooth_number);
  };

  const quickStatus = (status) => {
    setDraft((prev) => ({
      ...prev,
      status,
      custom_status: status === 'OTRO' ? prev.custom_status : '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
              <Activity className="h-3.5 w-3.5" /> FDI
            </div>
            <h3 className="mt-3 text-lg font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Piezas con historial</div>
              <div className="mt-1 text-xl font-black text-slate-900">{totalTeethWithHistory}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registros</div>
              <div className="mt-1 text-xl font-black text-slate-900">{totalRecords}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Seleccionado</div>
              <div className="mt-1 text-xl font-black text-slate-900">{selectedTooth}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-2">
              {QUADRANTS.map((quadrant) => (
                <div key={quadrant.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{quadrant.title}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{quadrant.subtitle}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                      FDI
                    </div>
                  </div>

                  <div className="grid grid-cols-8 gap-2">
                    {quadrant.teeth.map((toothNumber) => {
                      const toothRecord = latestByTooth[String(toothNumber)] || null;
                      return (
                        <ToothButton
                          key={`${quadrant.key}-${toothNumber}`}
                          toothNumber={toothNumber}
                          record={toothRecord}
                          selected={selectedTooth === String(toothNumber)}
                          onClick={() => handleSelectTooth(toothNumber)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => quickStatus(option.value)}
                  disabled={readOnly}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${draft.status === option.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'} ${readOnly ? 'opacity-70' : ''}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 h-fit">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Diente seleccionado</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{selectedTooth}</div>
              <div className="mt-1 text-sm text-slate-500">{selectedLatest ? `Último estado: ${getStatusMeta(selectedLatest.status).label}` : 'Sin historial registrado'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-900">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Estado</label>
              <select
                value={draft.status}
                onChange={(e) => quickStatus(e.target.value)}
                disabled={readOnly}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {draft.status === 'OTRO' ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Especificar estado</label>
                <input
                  value={draft.custom_status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, custom_status: e.target.value }))}
                  disabled={readOnly}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                  placeholder="Ej. Hipoplasia, sellante perdido..."
                />
              </div>
            ) : null}

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Tratamiento</label>
              <input
                value={draft.treatment}
                onChange={(e) => setDraft((prev) => ({ ...prev, treatment: e.target.value }))}
                disabled={readOnly}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                placeholder="Ej. Resina compuesta, sellador, control..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Superficies</label>
              <input
                value={draft.surfaces}
                onChange={(e) => setDraft((prev) => ({ ...prev, surfaces: e.target.value }))}
                disabled={readOnly}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                placeholder="Ej. M, O, D..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Notas clínicas</label>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                disabled={readOnly}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                placeholder="Hallazgos clínicos, observaciones, dolor, etc."
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Fecha</label>
              <input
                type="datetime-local"
                value={draft.date}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                disabled={readOnly}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={readOnly}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                Guardar registro
              </button>
              <button
                type="button"
                onClick={() => setDraft(createEmptyDraft(selectedTooth, patientId, createdBy))}
                disabled={readOnly}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500 transition-all hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              <Clock3 className="h-3.5 w-3.5" /> Historial del diente
            </div>
            <div className="mt-4 space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {selectedHistory.length > 0 ? (
                [...selectedHistory].sort((a, b) => parseDateSafe(b.date).getTime() - parseDateSafe(a.date).getTime()).map((entry, index) => {
                  const meta = getStatusMeta(entry.status);
                  return (
                    <div key={`${entry.tooth_number}-${entry.date}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-slate-900">{meta.label}{entry.custom_status ? ` · ${entry.custom_status}` : ''}</div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {parseDateSafe(entry.date).toLocaleString('es-MX', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>
                        <span className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white" style={{ backgroundColor: meta.color }}>
                          {entry.status}
                        </span>
                      </div>
                      {entry.treatment ? (
                        <div className="mt-2 text-xs text-slate-700">
                          <span className="font-black uppercase tracking-[0.18em] text-slate-400">Tratamiento:</span> {entry.treatment}
                        </div>
                      ) : null}
                      {entry.notes ? (
                        <div className="mt-1 text-xs text-slate-600">
                          <span className="font-black uppercase tracking-[0.18em] text-slate-400">Notas:</span> {entry.notes}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Selecciona un diente y registra el primer cambio para crear su historial.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            <Shield className="h-4 w-4 text-slate-900" />
            El historial no sobrescribe registros previos: cada guardado crea una nueva entrada.
          </div>
        </aside>
      </div>
    </div>
  );
}
