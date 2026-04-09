# Azure Rollout Planning (DentalCare + WhatsApp)

## Objective
Prepare the current version for cloud testing on Azure with secure config handling, stable webhook delivery, and controlled rollout of WhatsApp 24h reminders.

## Scope
- Backend API deployment to Azure App Service
- PostgreSQL connectivity
- WhatsApp webhook public availability and verification
- Runtime reminder operations and monitoring
- Safe staging launch before production

## Phase 1 - Pre-Deploy Hardening (Day 1)

1. Config and secrets
- Move all runtime secrets to Azure App Service settings (never commit real secrets).
- Keep local placeholders in `backend/.env` only for local runs.
- Ensure `WHATSAPP_ACCESS_TOKEN`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are strong values.

2. Multi-tenant safety checks
- Validate owner-only access to `/api/v1/reminders/config`.
- Validate per-organization config isolation in reminder read/write paths.

3. Webhook readiness
- Confirm `GET /api/v1/reminders/webhook` challenge flow.
- Confirm `POST /api/v1/reminders/webhook` handles 1/2/3 responses and logs actions.

4. Operational defaults
- Start staging with:
  - `WHATSAPP_ENABLED=true`
  - `WHATSAPP_DRY_RUN=true`
  - Per-org `reminders_enabled=true` from UI

## Phase 2 - Azure Staging Deploy (Day 1-2)

1. Infrastructure choices
- Azure App Service (Linux, Node 20)
- Azure Database for PostgreSQL (or existing managed PostgreSQL)
- HTTPS custom domain for webhook callback

2. Deploy sequence
- Build and deploy backend to Azure App Service.
- Configure App Settings with all required env vars.
- Run Prisma migrations against staging DB.
- Verify health endpoint and login flow.

3. Webhook registration in Meta
- Callback URL: `https://<staging-domain>/api/v1/reminders/webhook`
- Verify token: match app setting or org config
- Subscribe to message events

4. Staging validations
- Save WhatsApp config from Owner UI.
- Trigger `run-24h` job manually.
- Validate reminder logs and audit entries.

## Phase 3 - Functional Validation (Day 2)

1. Dry-run tests
- Confirm reminders are scanned and marked without outbound failures.
- Validate no duplicate sends for same appointment+type.

2. Real-send smoke test
- Flip one org to real send:
  - `WHATSAPP_DRY_RUN=false` (or persisted org value)
- Send manual reminder for a controlled appointment.
- Verify delivery and inbound response handling.

3. Failure tests
- Invalid token / provider error path
- Missing phone path
- Non-matching webhook sender path

## Phase 4 - Go-Live Controls (Day 3)

1. Security improvements before production
- Encrypt persisted WhatsApp tokens at rest.
- Add rate limiting for webhook endpoint.
- Restrict owner config changes with audit fields (who/when).

2. Observability
- Dashboard metrics: scanned, sent, skipped, failed per org.
- Alert when failed ratio exceeds threshold.

3. Release strategy
- Enable org-by-org instead of global cutover.
- Keep rollback path: `WHATSAPP_ENABLED=false`.

## Required Environment Variables

Use these as Azure App Settings for backend:

- `NODE_ENV=production`
- `PORT=3000`
- `API_URL=https://<your-backend-domain>`
- `DATABASE_URL=<postgres-connection-string>`
- `TEST_DATABASE_URL=<optional-staging-test-db>`
- `JWT_SECRET=<strong-secret>`
- `JWT_REFRESH_SECRET=<strong-secret>`
- `AZURE_STORAGE_CONNECTION_STRING=<optional>`
- `AZURE_STORAGE_CONTAINER=dentalcare-assets`
- `WHATSAPP_ENABLED=true`
- `WHATSAPP_DRY_RUN=true`
- `WHATSAPP_API_VERSION=v21.0`
- `WHATSAPP_PHONE_NUMBER_ID=<meta-phone-number-id>`
- `WHATSAPP_ACCESS_TOKEN=<meta-access-token>`
- `WHATSAPP_TEMPLATE_NAME=appointment_confirmation_24h`
- `WHATSAPP_TEMPLATE_LANG=es_MX`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN=<strong-random-token>`
- `REMINDERS_ENABLED=true`
- `REMINDERS_WINDOW_MINUTES=15`
- `REMINDERS_JOB_INTERVAL_MS=300000`

## Exit Criteria for Staging

1. Reminder config persists after restart.
2. Webhook verification succeeds from Meta.
3. Manual send endpoint works for controlled appointment.
4. Inbound response updates appointment/audit correctly.
5. No critical errors in backend logs for 24h.
