import React, { useEffect, useState } from 'react';
import { MessageCircle, Play, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../lib/axios';
import { Button, Card, Input, LoadingScreen, SectionHeader } from '../../components/ui';

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
  windowMinutes: 15,
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
    templateLang: 'en_US',
  });

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/reminders/config-status');
      const current = data.data;
      setStatus(current);
      setConfig((previous) => ({
        ...previous,
        enabled: current.enabled,
        dryRun: current.dryRun,
        apiVersion: current.apiVersion || previous.apiVersion,
        templateName: current.templateName || previous.templateName,
        templateLang: current.templateLang || previous.templateLang,
        phoneNumberId: current.phoneNumberId || '',
      }));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar el estado',
        text: error?.response?.data?.message || 'Error consultando configuración WhatsApp.',
        confirmButtonColor: '#0f172a',
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
        showConfirmButton: false,
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: error?.response?.data?.message || 'Error al guardar configuración.',
        confirmButtonColor: '#0f172a',
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
        text: `Escaneadas: ${result.scanned}, enviadas: ${result.sent}, omitidas: ${result.skipped}, fallidas: ${result.failed}`,
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Job falló',
        text: error?.response?.data?.message || 'No se pudo ejecutar el job 24h.',
        confirmButtonColor: '#0f172a',
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
        text: 'Ingresa el número de WhatsApp de prueba.',
        confirmButtonColor: '#0f172a',
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
        text: `Mensaje enviado a ${result.to}. ID: ${result.messageId || 'N/A'}`,
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar la prueba',
        text: error?.response?.data?.message || 'Error enviando mensaje de prueba.',
        confirmButtonColor: '#0f172a',
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
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar la prueba a pacientes',
        text: error?.response?.data?.message || 'Error enviando prueba masiva a pacientes.',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setSendingPatientsTest(false);
    }
  };

  const statusTone = status?.readyForProduction
    ? 'border-success-100 bg-success-50 text-success-600'
    : status?.readyForDryRun
      ? 'border-warning-100 bg-warning-50 text-warning-600'
      : 'border-danger-100 bg-danger-50 text-danger-600';

  if (loading) {
    return <LoadingScreen title="Cargando configuración WhatsApp" description="Sincronizando recordatorios y estado operativo" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Mensajería y recordatorios"
        title="Configuración WhatsApp Meta"
        description="Panel runtime para recordatorios de confirmación 24h, pruebas y estado operativo."
      />

      <Card className={`border ${statusTone} p-6`}>
        <div className="flex items-start gap-3">
          <div className="rounded-panel bg-surface p-2 shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-label">Estado actual</p>
            <p className="text-body font-medium">
              {status?.readyForProduction
                ? 'Listo para producción.'
                : status?.readyForDryRun
                  ? 'Listo para pruebas (dry-run).'
                  : 'Configuración incompleta.'}
            </p>
            {!!status?.missing?.length ? (
              <p className="text-caption uppercase tracking-[0.16em] text-muted">
                Faltan: {status.missing.join(', ')}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-muted px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <MessageCircle className="h-4 w-4" />
              Credenciales Meta
            </div>
            <p className="mt-1 text-body text-muted">Variables necesarias para la conexión con WhatsApp Cloud API.</p>
          </div>

          <div className="space-y-6 p-6">
            <Input
              type="password"
              label="Access Token"
              value={config.token}
              onChange={(event) => setConfig({ ...config, token: event.target.value })}
              placeholder="EAAG..."
            />

            <Input
              label="Phone Number ID"
              value={config.phoneNumberId}
              onChange={(event) => setConfig({ ...config, phoneNumberId: event.target.value })}
              placeholder="123456789012345"
            />

            <Input
              label="Webhook Verify Token"
              value={config.webhookVerifyToken}
              onChange={(event) => setConfig({ ...config, webhookVerifyToken: event.target.value })}
              placeholder="token-privado-seguro"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-muted px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <RefreshCw className="h-4 w-4" />
              Plantilla y job
            </div>
            <p className="mt-1 text-body text-muted">Ajustes del recordatorio 24h y validación de la plantilla de mensajería.</p>
          </div>

          <div className="space-y-6 p-6">
            <Input
              label="Template Name"
              value={config.templateName}
              onChange={(event) => setConfig({ ...config, templateName: event.target.value })}
            />

            <Input
              label="Template Lang"
              value={config.templateLang}
              onChange={(event) => setConfig({ ...config, templateLang: event.target.value })}
              placeholder="es_MX"
            />

            <Input
              label="API Version"
              value={config.apiVersion}
              onChange={(event) => setConfig({ ...config, apiVersion: event.target.value })}
              placeholder="v21.0"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-panel border border-border bg-surface px-4 py-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) => setConfig({ ...config, enabled: event.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                WhatsApp enabled
              </label>
              <label className="flex items-center gap-3 rounded-panel border border-border bg-surface px-4 py-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={config.dryRun}
                  onChange={(event) => setConfig({ ...config, dryRun: event.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                Dry run
              </label>
              <label className="flex items-center gap-3 rounded-panel border border-border bg-surface px-4 py-3 text-sm font-medium text-ink sm:col-span-2">
                <input
                  type="checkbox"
                  checked={config.remindersEnabled}
                  onChange={(event) => setConfig({ ...config, remindersEnabled: event.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                Scheduler enabled
              </label>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-border bg-surface-muted px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              <Play className="h-4 w-4" />
              Prueba manual de envío
            </div>
            <p className="mt-1 text-body text-muted">Envía mensajes de prueba a un número o a pacientes registrados para validar el flujo completo.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            <Input
              label="Número destino"
              value={testData.to}
              onChange={(event) => setTestData({ ...testData, to: event.target.value })}
              placeholder="5215512345678"
              containerClassName="lg:col-span-1"
            />

            <Input
              label="Template de prueba"
              value={testData.templateName}
              onChange={(event) => setTestData({ ...testData, templateName: event.target.value })}
              placeholder="hello_world"
            />

            <Input
              label="Idioma del template"
              value={testData.templateLang}
              onChange={(event) => setTestData({ ...testData, templateLang: event.target.value })}
              placeholder="en_US"
            />
          </div>

          <div className="border-t border-border bg-surface-muted px-6 py-4">
            <p className="text-caption uppercase tracking-[0.16em] text-muted">
              Sugerencia para Meta sandbox: hello_world + en_US.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar configuración
        </Button>

        <Button variant="secondary" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4" />
          Refrescar estado
        </Button>

        <Button variant="secondary" onClick={handleRun24hJob} disabled={running}>
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Ejecutar job 24h
        </Button>

        <Button variant="secondary" onClick={handleSendTestToPatients} disabled={sendingPatientsTest}>
          {sendingPatientsTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Probar con pacientes
        </Button>

        <Button variant="secondary" onClick={handleSendTest} disabled={sendingTest}>
          {sendingTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Enviar prueba WhatsApp
        </Button>
      </div>
    </div>
  );
}
