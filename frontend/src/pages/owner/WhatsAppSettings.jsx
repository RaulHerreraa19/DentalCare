import React, { useEffect, useState } from 'react';
import { MessageCircle, ShieldCheck, Save, Play, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../lib/axios';

const defaultConfig = {
  enabled: false,
  dryRun: true,
  token: '',
  phoneNumberId: '',
  apiVersion: 'v21.0',
  templateName: 'appointment_confirmation_24h',
  templateLang: 'es_MX',
  webhookVerifyToken: '',
  remindersEnabled: false,
  jobIntervalMs: 300000,
  windowMinutes: 15
};

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingPatientsTest, setSendingPatientsTest] = useState(false);
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(defaultConfig);
  const [testData, setTestData] = useState({
    to: '',
    templateName: 'hello_world',
    templateLang: 'en_US'
  });

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/reminders/config-status');
      const current = data.data;
      setStatus(current);
      setConfig((prev) => ({
        ...prev,
        enabled: current.enabled,
        dryRun: current.dryRun,
        apiVersion: current.apiVersion || prev.apiVersion,
        templateName: current.templateName || prev.templateName,
        templateLang: current.templateLang || prev.templateLang,
        phoneNumberId: current.phoneNumberId || ''
      }));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar estado',
        text: error?.response?.data?.message || 'Error consultando configuración WhatsApp.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post('/reminders/config', config);
      await fetchStatus();
      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'Se actualizó la configuración runtime de WhatsApp.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: error?.response?.data?.message || 'Error al guardar configuración.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRun24hJob = async () => {
    try {
      setRunning(true);
      const { data } = await api.post('/reminders/jobs/run-24h');
      const result = data.data;
      Swal.fire({
        icon: 'success',
        title: 'Job ejecutado',
        text: `Escaneadas: ${result.scanned}, enviadas: ${result.sent}, omitidas: ${result.skipped}, fallidas: ${result.failed}`
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Job falló',
        text: error?.response?.data?.message || 'No se pudo ejecutar el job 24h.'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSendTest = async () => {
    if (!testData.to) {
      Swal.fire({
        icon: 'warning',
        title: 'Número requerido',
        text: 'Ingresa el número de WhatsApp de prueba.'
      });
      return;
    }

    try {
      setSendingTest(true);
      const { data } = await api.post('/reminders/test-message', testData);
      const result = data.data;

      Swal.fire({
        icon: 'success',
        title: 'Prueba enviada',
        text: `Mensaje enviado a ${result.to}. ID: ${result.messageId || 'N/A'}`
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar prueba',
        text: error?.response?.data?.message || 'Error enviando mensaje de prueba.'
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendTestToPatients = async () => {
    try {
      setSendingPatientsTest(true);
      const { data } = await api.post('/reminders/test-message/patients', {
        templateName: testData.templateName,
        templateLang: testData.templateLang,
      });

      const result = data.data;
      const failedLines = (result.details || [])
        .filter((item) => item.status === 'FAILED')
        .slice(0, 5)
        .map((item) => `${item.patient_name}: ${item.error}`)
        .join(' | ');

      Swal.fire({
        icon: result.failed > 0 ? 'warning' : 'success',
        title: 'Prueba a pacientes ejecutada',
        text: `Candidatos: ${result.totalCandidates}, Enviados: ${result.sent}, Fallidos: ${result.failed}${failedLines ? `. Errores: ${failedLines}` : ''}`,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar prueba a pacientes',
        text: error?.response?.data?.message || 'Error enviando prueba masiva a pacientes.',
      });
    } finally {
      setSendingPatientsTest(false);
    }
  };

  const statusColor = status?.readyForProduction
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : status?.readyForDryRun
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold uppercase text-xs">Cargando Configuración WhatsApp...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-emerald-600" />
          Configuración WhatsApp Meta
        </h1>
        <p className="text-slate-500 mt-2 font-bold text-xs uppercase tracking-widest">
          Panel de configuración runtime para recordatorios de confirmación 24h.
        </p>
      </div>

      <div className={`border rounded-2xl p-4 ${statusColor}`}>
        <div className="flex items-center gap-2 font-black uppercase text-xs tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          Estado Actual
        </div>
        <p className="mt-2 text-sm font-semibold">
          {status?.readyForProduction
            ? 'Listo para producción.'
            : status?.readyForDryRun
              ? 'Listo para pruebas (dry-run).'
              : 'Configuración incompleta.'}
        </p>
        {!!status?.missing?.length && (
          <p className="mt-2 text-xs font-bold uppercase tracking-wider">
            Faltan: {status.missing.join(', ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-900">Credenciales Meta</h2>

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Access Token</label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="EAAG..."
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number ID</label>
          <input
            value={config.phoneNumberId}
            onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="123456789012345"
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Webhook Verify Token</label>
          <input
            value={config.webhookVerifyToken}
            onChange={(e) => setConfig({ ...config, webhookVerifyToken: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="token-privado-seguro"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-900">Plantilla y Job</h2>

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Template Name</label>
          <input
            value={config.templateName}
            onChange={(e) => setConfig({ ...config, templateName: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Template Lang</label>
          <input
            value={config.templateLang}
            onChange={(e) => setConfig({ ...config, templateLang: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="es_MX"
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">API Version</label>
          <input
            value={config.apiVersion}
            onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="v21.0"
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              WhatsApp Enabled
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.dryRun}
                onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
              />
              Dry Run
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={config.remindersEnabled}
                onChange={(e) => setConfig({ ...config, remindersEnabled: e.target.checked })}
              />
              Scheduler Enabled
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-900">Prueba Manual de Envío</h2>

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Número destino (con lada)</label>
          <input
            value={testData.to}
            onChange={(e) => setTestData({ ...testData, to: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="5215512345678"
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Template de prueba</label>
          <input
            value={testData.templateName}
            onChange={(e) => setTestData({ ...testData, templateName: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="hello_world"
          />

          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Idioma template</label>
          <input
            value={testData.templateLang}
            onChange={(e) => setTestData({ ...testData, templateLang: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold"
            placeholder="en_US"
          />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Sugerencia para Meta sandbox: hello_world + en_US.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black flex items-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Configuración
        </button>

        <button
          onClick={fetchStatus}
          className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-100 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refrescar Estado
        </button>

        <button
          onClick={handleRun24hJob}
          disabled={running}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Ejecutar Job 24h
        </button>

        <button
          onClick={handleSendTestToPatients}
          disabled={sendingPatientsTest}
          className="px-6 py-3 rounded-xl bg-fuchsia-600 text-white text-xs font-black uppercase tracking-widest hover:bg-fuchsia-700 flex items-center gap-2"
        >
          {sendingPatientsTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Probar con Pacientes Registrados
        </button>

        <button
          onClick={handleSendTest}
          disabled={sendingTest}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
        >
          {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Enviar Prueba WhatsApp
        </button>
      </div>
    </div>
  );
}
