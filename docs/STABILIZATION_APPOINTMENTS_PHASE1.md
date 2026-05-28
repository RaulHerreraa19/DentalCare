Stabilization: Appointments / Calendar — Phase 1
===============================================

Summary
-------
This PR stabilizes the appointments/calendar contract with two minimal, low-risk changes:

- Add `GET /appointments/:id` with organization validation (tenant-safety).
- Make `DoctorDashboard` compute doctor-scoped metrics client-side to match `DoctorSchedule`.

Files changed
-------------
- `backend/src/modules/appointments/appointments.router.js` — added `GET /appointments/:id` route.
- `backend/src/modules/appointments/appointments.controller.js` — added `getAppointmentById` controller.
- `backend/src/modules/appointments/appointments.service.js` — added `getAppointmentById(organizationId, appointmentId)` using `findFirst` and includes (`patient`,`doctor`,`services`,`clinic`).
- `backend/test/appointments.service.test.js` — unit tests for `getAppointmentById`.
- `frontend/src/pages/doctor/Dashboard.jsx` — filter dashboard appointments by `appointment.doctor?.id === user?.id`.
- `frontend/src/pages/doctor/__tests__/Dashboard.test.jsx` — dashboard regression test.
- `frontend/src/pages/doctor/__tests__/MedicalRecordWizard.test.jsx` — medical record flow 404 tolerance test.

Stable contracts
----------------
- `GET /api/v1/appointments/:id` — returns appointment object when `organization_id` matches `req.user.organization_id`.
  - Response shape: same appointment object shape as other appointment endpoints (includes `patient`, `doctor`, `services`, `clinic`).
  - 404 returned when not found or organization mismatch.

Rollback steps
--------------
1. Revert frontend file: `git checkout -- frontend/src/pages/doctor/Dashboard.jsx`
2. Revert backend files: `git checkout -- backend/src/modules/appointments/appointments.router.js backend/src/modules/appointments/appointments.controller.js backend/src/modules/appointments/appointments.service.js`
3. Remove tests if necessary: `git checkout -- backend/test/appointments.service.test.js frontend/src/pages/doctor/__tests__/*`

Manual QA checklist
-------------------
Backend
- [ ] GET `/api/v1/appointments/:id` returns 200 for a same-organization appointment and contains `patient`,`doctor`,`services`,`clinic`.
- [ ] GET `/api/v1/appointments/:id` returns 404 for appointment belonging to another org.

Frontend
- [ ] As a doctor, Dashboard.Citas Hoy equals number of items in DoctorSchedule for today.
- [ ] Opening `MedicalRecordWizard?appointmentId=...` where appointment id does not exist shows patient data (if present) and does not crash.
- [ ] Creating/updating appointment flows work as before (no payload change).
- [ ] Stale requests (e.g., patient search in CreateAppointmentModal) do not overwrite current selection after rapid queries or unmount.

Deferred / known architectural debt
----------------------------------
- `GET /api/v1/appointments` remains unpaged and can be heavy for large orgs.
- No server-side `doctor_id` scoping was added — client-side filtering is used temporarily.
- Authorization policies for `PATCH /appointments/:id/status` and `service_ids` validation remain unchanged (doctor-vs-receptionist semantics still enforced as before).
- Timezone semantics were intentionally not changed; UTC vs local edge cases remain to be consolidated.

Why `doctor_id` filtering deferred
---------------------------------
- Adding server-side `doctor_id` filtering requires API contract changes and coordinated frontend updates and tests. To minimize risk this phase keeps backend surface stable and applies a safe frontend alignment.

Known limitations / timezone notes
--------------------------------
- Date range queries still rely on ISO strings provided by clients; timezone drift can cause missing appointments around boundaries. This is documented and will be addressed in Phase 2.

Scalability limitations
-----------------------
- Large orgs requesting wide date ranges against `GET /appointments` may incur high memory/latency. Phase 2 will introduce pagination or server-side scoping.

Deployment & verification guidance
---------------------------------
See PR description for step-by-step rollout and monitoring recommendations.
