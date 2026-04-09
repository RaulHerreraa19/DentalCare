# WhatsApp 24h Reminders Setup (Meta Cloud API)

## 1) Prerequisitos Meta

1. Crea o usa un Meta Business Manager verificado.
2. Crea una app en Meta Developers.
3. Agrega el producto WhatsApp.
4. Obtén:
- Phone Number ID
- Access Token (temporal o permanente)
- WhatsApp Business Account ID
5. Crea una plantilla aprobada por Meta con 5 variables en body para este proyecto:
- paciente
- clinica
- fecha
- hora
- appointmentId

## 2) Variables de entorno (backend)

Configura estas variables en backend:

- WHATSAPP_ENABLED=true
- WHATSAPP_DRY_RUN=true
- WHATSAPP_API_VERSION=v21.0
- WHATSAPP_PHONE_NUMBER_ID=<tu_phone_number_id>
- WHATSAPP_ACCESS_TOKEN=<tu_access_token>
- WHATSAPP_TEMPLATE_NAME=appointment_confirmation_24h
- WHATSAPP_TEMPLATE_LANG=es_MX
- WHATSAPP_WEBHOOK_VERIFY_TOKEN=<token_privado_largo>
- REMINDERS_ENABLED=true
- REMINDERS_WINDOW_MINUTES=15
- REMINDERS_JOB_INTERVAL_MS=300000

Notas:
1. Empieza con WHATSAPP_DRY_RUN=true para validar flujo sin enviar mensajes reales.
2. Cuando todo esté estable cambia WHATSAPP_DRY_RUN=false.

## 3) Webhook de Meta

URL de verificación y eventos:

- GET/POST /api/v1/reminders/webhook

Debes publicar tu backend con URL pública HTTPS (por ejemplo, tunnel temporal) para que Meta pueda llamar el webhook.

Configuración en Meta:
1. Callback URL: https://<tu-dominio>/api/v1/reminders/webhook
2. Verify token: el valor de WHATSAPP_WEBHOOK_VERIFY_TOKEN
3. Suscribe eventos de mensajes (messages)

## 4) Endpoints operativos internos

Requieren autenticación y rol OWNER o RECEPTIONIST:

1. GET /api/v1/reminders/config-status
2. POST /api/v1/reminders/jobs/run-24h
3. POST /api/v1/reminders/:appointmentId/send-now
4. GET /api/v1/reminders/logs

## 5) Pruebas recomendadas

### 5.1 Validar configuración

1. Login y toma token.
2. Consulta config:

curl -X GET "http://localhost:3000/api/v1/reminders/config-status" \
  -H "Authorization: Bearer <token>"

### 5.2 Prueba manual por cita (dry-run)

curl -X POST "http://localhost:3000/api/v1/reminders/<appointment_id>/send-now" \
  -H "Authorization: Bearer <token>"

Luego revisa:

curl -X GET "http://localhost:3000/api/v1/reminders/logs" \
  -H "Authorization: Bearer <token>"

### 5.3 Probar webhook de verificación

curl "http://localhost:3000/api/v1/reminders/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=12345"

Debe responder: 12345

## 6) Respuestas del paciente

El webhook procesa:

1. "1" => marca cita como CONFIRMED
2. "2" => registra solicitud de reprogramación en auditoría
3. "3" => marca cita como CANCELLED

## 7) Salida a producción

1. Mantén scheduler activo (REMINDERS_ENABLED=true).
2. Cambia a envío real (WHATSAPP_DRY_RUN=false).
3. Usa access token de larga duración.
4. Monitorea /api/v1/reminders/logs diariamente.
5. Configura alertas internas para incremento de FAILED.
