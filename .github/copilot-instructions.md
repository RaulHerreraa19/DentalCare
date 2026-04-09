# Project Guidelines

## Code Style
- Preserve the current layered backend pattern: `router -> controller -> service -> Prisma`.
- Keep controllers thin: parse request input, call services, and return via `ApiResponse` from `backend/src/utils/apiResponse.js`.
- Put business rules and database access in service files under `backend/src/modules/*/*.service.js`.
- Use `AppError` from `backend/src/utils/AppError.js` for operational errors and let `backend/src/middlewares/error.middleware.js` handle the response.
- Follow existing naming and module conventions:
  - Backend uses CommonJS and feature folders in `backend/src/modules/`.
  - Database fields and tables are snake_case in Prisma schema/migrations.
  - Frontend uses React function components and role-based routing in `frontend/src/App.jsx`.
- Keep API-facing messages consistent with the existing Spanish-language UX in backend modules.

## Architecture
- This is a multi-tenant app: tenant boundary is organization-scoped data (`organization_id`) enforced in service-layer queries.
- Backend stack: Express + Prisma + PostgreSQL with middleware-centric request flow in `backend/src/app.js`.
- Auth flow uses JWT (`Bearer` header or `jwt` cookie) via `backend/src/middlewares/auth.middleware.js`.
- RBAC is enforced with `restrictTo(...)` in routers via `backend/src/middlewares/rbac.middleware.js`.
- Cross-cutting services live outside feature modules (for example storage/audit services under `backend/src/services/` and `backend/src/modules/audit/`).
- Frontend is a Vite React app with shared auth state in `frontend/src/context/AuthContext.jsx` and API client setup in `frontend/src/lib/axios.js`.

## Build and Test
- Prefer Docker for full-stack local startup:
  - `docker-compose up -d`
- Backend local workflow:
  - `cd backend`
  - `npm install`
  - `npm run dev`
- Frontend local workflow:
  - `cd frontend`
  - `npm install`
  - `npm run dev`
- Prisma workflow (backend):
  - `npx prisma migrate dev --name <migration_name>`
  - `npx prisma db seed`
- Current backend `npm test` is a placeholder and exits with error. Do not assume a passing automated test suite exists.

## Conventions
- Keep response envelopes consistent:
  - Success: `{ success: true, message, data }`
  - Error: `{ success: false, message, errors }`
- Reuse existing middleware order/patterns in `backend/src/app.js` when adding global middleware or routes.
- Keep role checks explicit in routers; roles in use include `SUPER_ADMIN`, `OWNER`, `DOCTOR`, `RECEPTIONIST`.
- Respect environment and port expectations from `docker-compose.yml`:
  - API: 3000, frontend: 5173, DB: 5432, test DB: 5433.
- For uploads, follow the existing storage abstraction in `backend/src/services/storage.service.js` (local fallback vs Azure blob configuration).
- Treat Prisma migrations as immutable once committed; add new migrations instead of editing old migration SQL.

## References
- Project overview and quick-start: `README.md`
- Compose environment and service wiring: `docker-compose.yml`
- Prisma data model: `backend/prisma/schema.prisma`