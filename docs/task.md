Lista de Tareas - Mejoras de Cumplimiento y UI/UX de DentalCare
Este documento sirve como bitácora y lista de control del plan aprobado. Se han añadido owners, estados, estimaciones y criterios de aceptación mínimos para cada tarea.

Formato de la tabla:
- **Task**: descripción de la tarea.
- **Owner**: responsable (placeholder si no asignado).
- **Status**: `todo` | `in-progress` | `done`.
- **Estimate (h)**: estimación aproximada en horas.
- **Priority**: `high` | `medium` | `low`.
- **Files / Commands**: punteros a archivos o comandos a ejecutar.
- **Acceptance Criteria**: condiciones verificables para cerrar la tarea.


| Task | Owner | Status | Estimate (h) | Priority | Files / Commands | Acceptance Criteria |
|---|---:|---:|---:|---:|---|---|
| Añadir campo `curp` al modelo `Patient` y migración Prisma | TBD | todo | 1 | high | `backend/prisma/schema.prisma`  
|  |  |  |  |  | Comando: `cd backend && npx prisma migrate dev --name add_curp_to_patient` | `patients` table contiene columna `curp`, única; migración aplicada sin pérdida de datos en staging |
| Implementar log de auditoría automático para VIEW en expedientes | TBD | todo | 4 | high | `backend/src/modules/medical-records/medical-records.controller.js`  
|  |  |  |  |  | Integrar con `audit` service o `backend/src/services/audit.service.js` | Al abrir un expediente, se crea un `AuditLog` con `event_type=RECORD_VIEW`, `actor_user_id`, `patient_id`, `ip_address` y `user_agent` |
| Enforce append-only para alergias en `updateRecord` | TBD | todo | 6 | high | `backend/src/modules/medical-records/medical-records.service.js:updateRecord`  
|  |  |  |  |  | Unit tests: `backend/test/medical-records.*.test.js` | Intento de eliminación de texto de alergias falla o concatena preservando la entrada anterior con timestamp y autor |
| Depurar persistencia y orden del odontograma histórico | TBD | todo | 4 | medium | `backend/src/modules/medical-records/*.service.js` | `getHistory` retorna odontograms y notes ordenados desc por fecha, sin duplicados ni registros vacíos |
| Añadir campo CURP en formularios de paciente (frontend) | TBD | todo | 3 | medium | `frontend/src/pages/patients/Patients.jsx` o el componente de formulario correspondiente | Formulario de creación/edición incluye `CURP` con validación (18 caracteres); al guardar, el backend persiste `curp` |
| Integrar CURP en vista de Ficha de Identificación | TBD | todo | 2 | low | `frontend/src/pages/doctor/MedicalRecordEditor.jsx` (o ruta real) | `CURP` se muestra en la sección de identificación cuando existe |
| Reestructurar UI: Separar Expediente Permanente vs Consulta Activa | TBD | todo | 12 | high | `frontend/src/pages/doctor/MedicalRecordEditor.jsx` / `frontend/src/components/MedicalRecordEditor` | Panel con pestañas/estado que permite alternar entre Consulta Activa y Expediente Permanente; navegar de ida y vuelta preserva borrador |
| Implementar banner de "Consulta Activa" y control de regreso | TBD | todo | 4 | medium | mismo componente anterior | Banner visible en modo Consulta con botón "Ver Expediente Clínico Completo" y acción "Regresar a Consulta" restaurando el estado del editor |
| Interfaz de Alergias (solo lectura + append-only) | TBD | todo | 6 | high | frontend + backend | Alergias visibles read-only; añadir nueva alergia crea entry con autor y timestamp; backend impide borrado de alergias previas |
| Línea de Tiempo de Evolución (notas históricas) | TBD | todo | 8 | medium | `frontend/src/pages/doctor/MedicalRecordEditor.jsx` + API `getHistory` | Timeline muestra notas ordenadas por fecha con filtro/búsqueda; abrir nota histórica no modifica la nota en edición |
| Visor de Odontogramas históricos (modo lectura) | TBD | todo | 10 | medium | frontend odontograma component | Seleccionar versión histórica cambia el visor a modo lectura y no altera el odontograma de trabajo actual |
| Pruebas funcionales y verificación regulatoria | TBD | todo | 8 | high | tests: unit + e2e; manual QA | Checklist de verificación (migración, logs VIEW, append-only alergias, navegación bidireccional) aprobado en staging |

Notas operativas y comandos rápidos

- Migración Prisma (staging):

```bash
cd backend
npx prisma migrate dev --name add_curp_to_patient
```

- Ejecutar tests backend (placeholder):

```bash
cd backend
npm test
```

- Comprobar logs de auditoría (ejemplo SQL):

```sql
SELECT * FROM audit_logs WHERE event_type = 'RECORD_VIEW' ORDER BY timestamp DESC LIMIT 10;
```

Prioridades y entrega

- Prioridad inmediata: migración (`curp`), logs de VIEW y regla append-only de alergias — son necesarios por cumplimiento legal (NOM-024 / NOM-004).
- UI/UX y timeline se planifican en la siguiente iteración tras estabilizar el backend.

Si quieres, asigno placeholders de owners a nombres concretos o creo issues/PR templates automáticamente.

-- Fin del documento actualizado --