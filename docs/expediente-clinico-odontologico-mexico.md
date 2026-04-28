# Expediente clinico odontologico digital para Mexico

Propuesta de diseno lista para implementar en software para una clinica dental en Mexico, alineada a la NOM-004-SSA3-2012 y a la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP).

Alcance realista para esta aplicacion:
- El expediente debe ser clinicamente util, auditable e inmutable en sus partes firmadas.
- El medico tratante sigue siendo el responsable de la integridad del expediente.
- La app debe conservar versionado, trazabilidad y evidencia de consentimientos.

Referencia al estado actual del sistema:
- Ya existe `MedicalRecord`, `MedicalNote` y `Odontogram`.
- El modelo actual guarda historia, diagnostico y plan, pero todavia mezcla campos, no separa secciones normativas y no asegura versionado ni reglas de inmutabilidad.

## 1) Estructura del expediente clinico

### 1. Ficha de identificacion

Objetivo medico-legal:
- Identificar sin ambiguedad al paciente y vincularlo con su responsable, contacto y datos de localizacion.
- Cumple trazabilidad basica y reduce riesgo de homonimia.

Campos:
- `patient_id` | UUID | obligatorio
- `organization_id` | UUID | obligatorio
- `patient_code` | texto | opcional, recomendado
- `first_name` | texto | obligatorio
- `last_name` | texto | obligatorio
- `date_of_birth` | fecha | obligatorio
- `gender` | catalogo | opcional
- `curp` | texto | opcional, recomendado si la clinica la captura
- `phone` | texto | obligatorio si hay contacto remoto
- `email` | texto | opcional
- `address` | texto | opcional
- `emergency_contact_name` | texto | obligatorio
- `emergency_contact_phone` | texto | obligatorio
- `responsible_person_name` | texto | opcional, obligatorio si menor o incapaz
- `relationship_to_patient` | catalogo/texto | opcional
- `created_at` | fecha-hora | obligatorio

Regla de obligatoriedad:
- Obligatorios por ley/practica segura: nombre, apellidos, fecha de nacimiento, contacto, contacto de urgencia, identificador interno del paciente.
- Recomendados: CURP, correo, responsable legal, relacion de parentesco.

Ejemplo en app:
```json
{
  "first_name": "Maria Fernanda",
  "last_name": "Lopez Rivera",
  "date_of_birth": "1993-08-12",
  "phone": "+52 55 1234 5678",
  "emergency_contact_name": "Juan Lopez",
  "emergency_contact_phone": "+52 55 8765 4321"
}
```

### 2. Historia clinica

Objetivo medico-legal:
- Documentar antecedentes relevantes para justificar diagnostico y tratamiento.
- Sirve de soporte ante complicaciones, alergias, contraindicaciones y consentimiento informado.

Subsecciones y campos:

2.1 Antecedentes heredofamiliares
- `family_history` | texto largo | opcional, recomendado

2.2 Antecedentes personales patologicos
- `chronic_diseases` | catalogo multi-seleccion | opcional
- `surgeries` | texto largo | opcional
- `hospitalizations` | texto largo | opcional
- `allergies` | texto largo / catalogo multi-seleccion | obligatorio si existen
- `current_medications` | texto largo | obligatorio si existen
- `pregnancy_status` | catalogo | opcional cuando aplique

2.3 Antecedentes personales no patologicos
- `smoking` | booleano + texto | opcional
- `alcohol_use` | booleano + texto | opcional
- `drug_use` | booleano + texto | opcional
- `oral_hygiene_habits` | texto largo | opcional
- `water_fluoridation_exposure` | texto corto | opcional

2.4 Antecedentes odontologicos
- `last_dental_visit` | fecha | opcional
- `reason_for_last_visit` | texto corto | opcional
- `previous_treatments` | texto largo | opcional
- `orthodontic_history` | texto largo | opcional
- `prosthetic_history` | texto largo | opcional
- `periodontal_history` | texto largo | opcional

Regla de obligatoriedad:
- No todo antecedente debe forzarse como obligatorio, pero alergias, medicamentos actuales, enfermedades cronicas y embarazo cuando aplique son de alto riesgo clinico y deben pedirse activamente.

### 3. Interrogatorio

Objetivo medico-legal:
- Registrar motivo de consulta y sintomas con lenguaje del paciente.
- Permite relacionar hallazgos con la evolucion de la enfermedad.

Campos:
- `chief_complaint` | texto largo | obligatorio
- `symptoms_start_date` | fecha | opcional
- `pain_presence` | booleano | opcional
- `pain_intensity` | entero 0-10 | opcional
- `pain_character` | catalogo/texto | opcional
- `pain_location` | texto | opcional
- `pain_triggers` | texto | opcional
- `pain_relief` | texto | opcional
- `review_of_systems` | texto largo | opcional

Ejemplo:
```json
{
  "chief_complaint": "Dolor en molar inferior derecho al masticar desde hace 5 dias",
  "pain_intensity": 8,
  "pain_character": "punzante",
  "pain_triggers": "frio y masticacion"
}
```

### 4. Exploracion clinica

Objetivo medico-legal:
- Dejar evidencia objetiva de lo observado en consulta.
- Soporta el diagnostico y evita ambiguedades.

Campos:
- `extraoral_exam` | texto largo | opcional
- `intraoral_exam` | texto largo | opcional
- `soft_tissues` | texto largo | opcional
- `periodontal_status` | catalogo/texto | opcional
- `hygiene_status` | catalogo/texto | opcional
- `dental_findings` | texto largo | obligatorio en visita clinica
- `radiographic_findings` | texto largo | opcional
- `vital_signs` | objeto/JSON | opcional pero recomendado
- `tooth_chart_snapshot` | JSON | opcional, pero recomendado si se usa odontograma

Campos tipicos de signos vitales:
- `blood_pressure_systolic` | numero
- `blood_pressure_diastolic` | numero
- `heart_rate` | numero
- `temperature` | numero decimal
- `respiratory_rate` | numero

### 5. Diagnostico

Objetivo medico-legal:
- Dejar la conclusion clinica sustentada en antecedentes y exploracion.
- Debe ser especifico y congruente con el plan terapeutico.

Campos:
- `primary_diagnosis` | texto largo | obligatorio
- `secondary_diagnoses` | lista/codigo | opcional
- `icd10_code` | catalogo/texto | opcional, recomendado
- `odontology_code` | catalogo/texto | opcional
- `diagnostic_basis` | texto largo | opcional, recomendado

Regla:
- No guardar diagnosticos vacios tipo "pendiente" sin contexto. Si aun no hay certeza, usar una nota de trabajo como "diagnostico presuntivo" y una fecha de reevaluacion.

### 6. Plan de tratamiento

Objetivo medico-legal:
- Mostrar opciones, secuencia y riesgos del tratamiento acordado.
- Vincula el consentimiento informado con el plan real.

Campos:
- `treatment_objective` | texto largo | obligatorio
- `proposed_procedures` | lista JSON | obligatorio
- `procedure_code` | catalogo/texto | opcional
- `tooth_numbers` | lista/cadena | opcional
- `materials` | JSON | opcional
- `number_of_sessions` | numero | opcional
- `estimated_cost` | decimal | opcional
- `risks_explained` | texto largo | obligatorio
- `alternatives_explained` | texto largo | obligatorio
- `prognosis` | texto largo | opcional
- `follow_up_plan` | texto largo | obligatorio

Ejemplo:
```json
{
  "treatment_objective": "Eliminar infeccion y restaurar funcion masticatoria",
  "proposed_procedures": [
    { "name": "Endodoncia pieza 46", "tooth": "46" },
    { "name": "Restauracion definitiva", "tooth": "46" }
  ],
  "risks_explained": "Dolor postoperatorio, fracaso endodontico, necesidad de retratamiento",
  "alternatives_explained": "Extraccion y protesis, manejo conservador temporal"
}
```

### 7. Notas de evolucion

Objetivo medico-legal:
- Registrar cada acto clinico por fecha, firma y relacion con cita o procedimiento.
- Debe permitir seguimiento cronologico y versionable.

Campos:
- `note_type` | catalogo | obligatorio
- `appointment_id` | UUID | opcional pero recomendado
- `subjective` | texto largo | opcional
- `objective` | texto largo | opcional
- `assessment` | texto largo | obligatorio
- `plan` | texto largo | obligatorio
- `procedures_performed` | JSON | opcional
- `prescriptions` | JSON | opcional
- `attachments` | JSON | opcional
- `author_id` | UUID | obligatorio
- `signed_at` | fecha-hora | obligatorio una vez firmada
- `signature_hash` | texto | obligatorio una vez firmada
- `is_signed` | booleano | obligatorio

Regla:
- Una nota firmada es inmutable. Si hay cambio clinico, se crea nota subsecuente, nunca se sobreescribe la anterior.

### 8. Odontograma

Objetivo medico-legal:
- Representar el estado dental de forma estructurada y visual.
- Permite seguimiento de caries, restauraciones, ausencias, tratamientos y hallazgos por pieza y superficie.

Campos minimos por pieza:
- `tooth_number` | catalogo | obligatorio
- `status` | catalogo | obligatorio
- `surfaces` | lista de catalogo | opcional
- `finding_text` | texto | opcional
- `treatment_text` | texto | opcional
- `date_recorded` | fecha-hora | obligatorio
- `recorded_by` | UUID | obligatorio

Estructura recomendada del estado:
- `CARIES`
- `RESTORED`
- `ENDODONTIC_TREATMENT`
- `EXTRACTED`
- `MISSING`
- `CROWN`
- `IMPLANT`
- `SEALANT`
- `FRACTURE`
- `PERIODONTAL_FINDING`
- `NORMAL`

Ejemplo:
```json
{
  "tooth_number": "46",
  "status": "CARIES",
  "surfaces": ["O", "M"],
  "finding_text": "Caries ocluso-mesial con sensibilidad a frio"
}
```

## 2) Reglas de cumplimiento

### Campos que no deben editarse despues de firmados

No editables despues de firma digital:
- Nota de evolucion firmada
- Consentimiento informado aceptado y firmado
- Diagnostico final firmado, si tu flujo lo separa como bloque cerrado
- Odontograma de cierre de tratamiento o version firmada
- Fecha/hora de atencion ya firmada cuando se usa como evidencia legal

Editables solo por nueva version, no por sobrescritura:
- Historia clinica
- Plan de tratamiento no firmado
- Odontograma en estado de trabajo
- Datos de contacto del paciente

### Como manejar correcciones sin violar normativa

Regla correcta:
- No hacer `UPDATE` sobre texto firmado.
- Crear una nueva version o una nota complementaria.
- Si hay error material antes de firma, permitir correccion con historial.
- Si el error ya fue firmado, usar addendum o nota aclaratoria con fecha, usuario y motivo.

Implementacion recomendada:
- `version_number` incremental por expediente y por seccion.
- `supersedes_version_id` para marcar reemplazo de una version previa.
- `correction_reason` obligatorio cuando una version sustituye otra.

Ejemplo de correccion:
```json
{
  "type": "CORRECTION",
  "target": "medical_note",
  "target_id": "note_123",
  "reason": "Se corrigio numero de pieza dental antes de la firma final",
  "new_version": 2
}
```

### Reglas de auditoria

Registrar siempre:
- Acceso a expediente
- Consulta de nota clinica
- Creacion de historia, diagnostico, plan, nota o odontograma
- Edicion de cualquier seccion editable
- Firma digital
- Rechazo o revocacion de consentimiento
- Exportacion o descarga de expediente
- Eliminacion logica
- Intento de acceso denegado

Campos minimos del log:
- `event_type`
- `actor_user_id`
- `actor_role`
- `target_type`
- `target_id`
- `organization_id`
- `patient_id`
- `timestamp`
- `ip_address`
- `user_agent`
- `before_snapshot` | opcional
- `after_snapshot` | opcional
- `reason` | opcional

### Requisitos minimos de trazabilidad

- Cada seccion del expediente debe tener autor, fecha, version y estado de firma.
- Toda nota debe poder relacionarse con cita, paciente y medico.
- Toda firma debe registrar sello de tiempo y hash del contenido firmado.
- Toda consulta de expediente debe registrar lectura, no solo escritura.
- Todo borrado debe ser logico; el registro medico no se elimina fisicamente.

## 3) Aviso de privacidad listo para copiar y pegar

### Version completa

Aviso de Privacidad Integral

Responsable del tratamiento de los datos personales

[Nombre de la clinica o razon social], con domicilio en [domicilio completo], es responsable del tratamiento de sus datos personales y datos personales sensibles, recabados con motivo de la prestacion de servicios odontologicos, administrativos y de seguimiento clinico.

Datos personales que recabamos

Para cumplir con las finalidades descritas en este aviso, podremos recabar de usted los siguientes datos personales: nombre completo, domicilio, telefono, correo electronico, fecha de nacimiento, sexo, ocupacion, contacto de emergencia, datos de facturacion, imagenes, identificadores internos, datos de cita y medios de contacto.

Asimismo, podremos recabar datos personales sensibles relacionados con su estado de salud, antecedentes heredofamiliares, antecedentes personales patologicos y no patologicos, alergias, medicamentos, embarazo, exploracion clinica, diagnosticos, radiografias, fotografias clinicas, odontograma, tratamientos realizados y consentimiento informado.

Finalidades del tratamiento

Los datos personales seran tratados para las siguientes finalidades primarias:
1. Identificarlo como paciente.
2. Integrar, actualizar y resguardar su expediente clinico.
3. Brindarle atencion odontologica, diagnostico, tratamiento, seguimiento y control clinico.
4. Generar citas, recordatorios y comunicacion relacionada con su atencion.
5. Emitir notas, recetas, consentimientos, presupuestos y comprobantes administrativos.
6. Cumplir obligaciones legales, sanitarias, fiscales y administrativas aplicables.
7. Dar seguimiento a incidentes clinicos, calidad y seguridad del paciente.

Finalidades secundarias

De manera adicional, sus datos podran ser utilizados para finalidades secundarias como encuestas de satisfaccion, envio de informacion sobre servicios de la clinica, promociones, recordatorios y mensajes por medios electronicos o WhatsApp, siempre que usted no se oponga cuando corresponda.

Transferencias

Sus datos podran ser compartidos, sin requerir su consentimiento en los casos permitidos por la ley, con autoridades sanitarias, fiscales, judiciales o administrativas que lo soliciten de manera fundada y motivada.

Tambien podran ser compartidos con terceros que nos presten servicios de apoyo tecnologico, almacenamiento, mensajeria, respaldo, firma electronica, nube o procesamiento de pagos, exclusivamente para las finalidades aqui descritas y bajo medidas de seguridad y confidencialidad.

Derechos ARCO y revocacion

Usted puede ejercer en cualquier momento sus derechos de acceso, rectificacion, cancelacion y oposicion, asi como revocar su consentimiento para el tratamiento de sus datos personales cuando proceda, enviando su solicitud a [correo electronico ARCO] o presentandola en [domicilio o medio de recepcion].

Su solicitud debera contener al menos: nombre del titular, medio para comunicarle la respuesta, documentos que acrediten su identidad y la descripcion clara de los datos o derechos respecto de los que solicita ejercer alguno de los derechos ARCO.

Medidas de seguridad

Hemos implementado medidas administrativas, tecnicas y fisicas para proteger sus datos personales, incluyendo control de accesos, bitacoras de auditoria, cifrado cuando aplica, y resguardo seguro de expedientes.

Cambios al aviso de privacidad

Este aviso puede ser modificado en cualquier momento. Las actualizaciones estaran disponibles en [URL o medio de consulta].

### Version corta UX

Resumen de privacidad

Usamos sus datos personales y datos de salud para identificarlo, darle atencion odontologica, llevar su expediente clinico, agendar citas, comunicarnos con usted y cumplir obligaciones legales. Sus datos sensibles se tratan con estricta confidencialidad. Puede ejercer sus derechos ARCO y revocar su consentimiento escribiendo a [correo ARCO].

## 4) Consentimiento informado digital

### A) Consentimiento para tratamiento de datos personales sensibles

Version corta UX

He leido el aviso de privacidad y autorizo el tratamiento de mis datos personales y datos personales sensibles para fines de atencion odontologica, integracion de expediente, comunicacion y cumplimiento legal.

Version completa legal

Yo, [nombre completo del paciente o representante], manifiesto que se me informo el aviso de privacidad y otorgo mi consentimiento expreso para el tratamiento de mis datos personales y datos personales sensibles, incluyendo datos de salud, antecedentes clinicos, diagnosticos, imagenes clinicas, radiografias, fotografias, recetas, notas medicas y demas informacion necesaria para mi atencion odontologica, integracion y conservacion de mi expediente clinico, gestion de citas, seguimiento, facturacion y cumplimiento de obligaciones legales.

Entiendo que puedo revocar este consentimiento en los casos legalmente procedentes, sin efectos retroactivos sobre tratamientos ya realizados ni sobre informacion que deba conservarse por obligacion legal.

Captura recomendada:
- Checkbox obligatorio sin preseleccionar.
- Firma manuscrita digital o firma con trazo en pantalla.
- Timestamp automatico.
- Identidad del firmante y, si aplica, evidencia del representante legal.
- Hash del texto aceptado.

### B) Consentimiento para atencion odontologica

Version corta UX

Autorizo que se me realicen valoracion, diagnostico y tratamiento odontologico conforme al plan explicado, incluyendo procedimientos necesarios, riesgos, alternativas y cuidados posteriores.

Version completa legal

Yo, [nombre completo], declaro que se me explico de manera clara mi estado de salud bucal, el diagnostico presuntivo o definitivo, el plan de tratamiento propuesto, los riesgos previsibles, las alternativas terapeuticas, las consecuencias de no realizar el tratamiento y los cuidados posteriores.

Otorgo mi consentimiento para la realizacion de los procedimientos odontologicos descritos en mi plan de tratamiento, autorizando al personal profesional competente a efectuar los actos necesarios dentro del alcance acordado y conforme a la lex artis, entendiendo que pueden presentarse complicaciones inherentes al tratamiento, a mi estado general de salud o a factores no previsibles.

Captura recomendada:
- Checkbox de aceptacion por cada procedimiento o por paquete terapeutico.
- Firma digital con trazo.
- Fecha y hora automaticas.
- Identificacion del medico que explica y del paciente que acepta.
- Version del documento aceptado.

### C) Consentimiento para uso de WhatsApp o medios electronicos

Version corta UX

Autorizo que la clinica me contacte por WhatsApp, SMS, correo electronico o medios equivalentes para citas, recordatorios, indicaciones y seguimiento.

Version completa legal

Autorizo expresamente a [nombre de la clinica] a contactarme por medios electronicos, incluyendo WhatsApp, SMS, llamada telefonica, correo electronico o plataformas equivalentes, para fines de agendado, recordatorios de cita, envio de indicaciones, seguimiento clinico, confirmaciones administrativas y comunicacion relacionada con mi atencion.

Entiendo que dichos medios pueden no ser totalmente inviolables y acepto el uso de estos canales bajo medidas razonables de seguridad y confidencialidad. Puedo retirar esta autorizacion en cualquier momento, sin afectar comunicaciones necesarias para obligaciones legales o atencion en curso.

Captura recomendada:
- Checkbox opcional separado del consentimiento principal.
- Preferencias por canal con switches individuales.
- Timestamp y version de texto.
- Evidencia del numero o medio autorizado.

## 5) Traduccion a software

### Esquema de base de datos recomendado

La app ya tiene `MedicalRecord`, `MedicalNote`, `Odontogram` y `AuditLog`, pero conviene separarlo en capas:

Tablas nuevas o ampliadas:
- `medical_record_versions`
- `medical_record_sections`
- `medical_note_versions`
- `odontogram_versions`
- `consents`
- `consent_signatures`
- `privacy_notices`
- `audit_logs` ya existe, pero debe enriquecerse

### Estructura sugerida

`medical_records`
- `id`
- `organization_id`
- `patient_id`
- `doctor_id`
- `status` | DRAFT, ACTIVE, CLOSED, ARCHIVED
- `current_version`
- `created_at`
- `updated_at`

`medical_record_versions`
- `id`
- `medical_record_id`
- `version_number`
- `created_by`
- `created_at`
- `signed_at`
- `signature_hash`
- `is_locked`
- `supersedes_version_id`
- `change_reason`

`medical_record_sections`
- `id`
- `medical_record_version_id`
- `section_key` | identification, history, interview, exam, diagnosis, plan, evolution, odontogram
- `section_data` | JSONB
- `section_status` | DRAFT, SIGNED, CORRECTED

`medical_notes`
- `id`
- `medical_record_id`
- `appointment_id`
- `author_id`
- `note_type`
- `current_version`
- `created_at`

`medical_note_versions`
- `id`
- `medical_note_id`
- `version_number`
- `content` | TEXT
- `attachments` | JSONB
- `is_signed`
- `signed_at`
- `signature_hash`
- `created_by`
- `created_at`
- `supersedes_version_id`

`odontograms`
- `id`
- `medical_record_id`
- `status` | DRAFT, ACTIVE, CLOSED
- `current_version`

`odontogram_versions`
- `id`
- `odontogram_id`
- `version_number`
- `tooth_data` | JSONB
- `created_by`
- `created_at`
- `signed_at`
- `signature_hash`
- `is_locked`

`consents`
- `id`
- `organization_id`
- `patient_id`
- `consent_type` | DATA_PRIVACY, DENTAL_TREATMENT, WHATSAPP
- `version`
- `language`
- `accepted` | boolean
- `accepted_at`
- `accepted_by`
- `document_hash`
- `document_snapshot` | JSONB or TEXT

`consent_signatures`
- `id`
- `consent_id`
- `signature_type` | DRAWN, CLICK_WRAP, OTP, CERTIFICATE
- `signed_by`
- `signed_at`
- `ip_address`
- `user_agent`
- `signature_hash`

### Relaciones clave

- `Organization 1-N Patient`
- `Patient 1-1..N MedicalRecord`
- `MedicalRecord 1-N MedicalRecordVersion`
- `MedicalRecordVersion 1-N MedicalRecordSection`
- `MedicalRecord 1-N MedicalNote`
- `MedicalNote 1-N MedicalNoteVersion`
- `MedicalRecord 1-N Odontogram`
- `Odontogram 1-N OdontogramVersion`
- `Patient 1-N Consent`
- `Consent 1-1 ConsentSignature`
- `User 1-N AuditLog`

### Implementacion recomendada de versionado

Modelo operativo:
1. El usuario edita un borrador.
2. Al firmar, se crea una version inmutable.
3. Si requiere correccion posterior, se crea una nueva version con referencia a la anterior.
4. La version firmada previa permanece consultable y trazable.

Reglas de negocio:
- Solo el borrador puede editarse.
- La firma cierra la version.
- La correccion no pisa la version anterior.
- El cierre del expediente bloquea nuevas ediciones, salvo addendum autorizado.

### Implementacion recomendada de logs de auditoria

Cada evento debe registrar:
- quien hizo la accion
- sobre que paciente o expediente
- desde donde se hizo
- que se cambio
- antes y despues cuando aplique
- si el acceso fue permitido o denegado

Eventos minimos:
- `RECORD_VIEW`
- `RECORD_CREATE`
- `RECORD_UPDATE`
- `RECORD_SIGN`
- `NOTE_CREATE`
- `NOTE_UPDATE`
- `NOTE_SIGN`
- `ODONTOGRAM_UPDATE`
- `CONSENT_ACCEPT`
- `CONSENT_REVOKE`
- `EXPORT_PDF`
- `ACCESS_DENIED`
- `DELETE_LOGICAL`

### Implementacion recomendada de control de accesos

Control por rol y por relacion clinica:
- `DOCTOR` puede leer y editar solo expedientes de sus pacientes asignados.
- `RECEPTIONIST` puede ver agenda y datos administrativos, no historia clinica ni diagnosticos sensibles.
- `OWNER` puede ver reportes agregados, no necesariamente el detalle clinico completo salvo configuracion expresa.
- `SUPER_ADMIN` solo por soporte tecnico y con modo de acceso excepcional auditado.

Control adicional:
- Verificacion de organizacion, clinica y asignacion del medico.
- Bloqueo por inactividad de sesion.
- MFA recomendado para perfiles con acceso clinico.
- Descarga de PDF solo con marca de agua y folio.

## 6) Clasificacion de requisitos

### Obligatorio por ley o por seguridad legal alta

- Ficha de identificacion completa
- Historia clinica y antecedentes relevantes
- Interrogatorio y exploracion
- Diagnostico y plan de tratamiento
- Nota de evolucion por atencion
- Consentimiento informado para procedimientos
- Aviso de privacidad
- Firma, fecha y hora de las notas clinicas
- Control de accesos y bitacora de consulta
- Conservacion e inmutabilidad de versiones firmadas

### Recomendado

- CURP
- Odontograma estructurado por piezas y superficies
- Versionado de borrador a firma
- Exportacion PDF con hash y folio
- WhatsApp con consentimiento separado
- Clasificacion por codigos clinicos
- Fotografias clinicas asociadas a consentimiento

### Riesgo alto si no se implementa

- Permitir editar notas ya firmadas
- Borrar expediente fisicamente
- Guardar consentimiento sin version o sin fecha/hora
- No registrar acceso a expediente
- Mezclar datos administrativos con datos clinicos sin control de acceso
- Mandar recordatorios por WhatsApp sin opt-in separado
- No separar borrador de version firmada

## 7) Errores tipicos en apps medicas que aqui deben evitarse

- Editar el texto de una nota ya firmada y conservar el mismo registro.
  - Forma correcta: nueva version o addendum firmado.

- Guardar un solo campo `notes` con todo el expediente.
  - Forma correcta: secciones estructuradas por finalidad clinica.

- Marcar consentimientos con solo un booleano sin evidencia.
  - Forma correcta: texto versionado, timestamp, usuario, hash y firma.

- Permitir a recepcion ver historia clinica completa.
  - Forma correcta: vistas separadas por rol.

- Usar `DELETE` real sobre historial medico.
  - Forma correcta: baja logica con retencion y bitacora.

- Mandar recordatorios por WhatsApp sin opt-in separado.
  - Forma correcta: consentimiento especifico y revocable.

## 8) Recomendacion concreta para esta app

Si quieres implementar esto sobre la base actual, el orden correcto es:
1. Separar `MedicalRecord` en secciones estructuradas y versionadas.
2. Convertir `MedicalNote` en entidad inmutable con version firmado.
3. Convertir `Odontogram` en version por estado clinico.
4. Crear tabla de `consents` con hash y firma.
5. Enriquecer `AuditLog` para que registre lecturas, firmas y denegaciones.
6. Crear vistas del frontend por rol y por estado del expediente.

Con esta base, la app deja de ser solo un repositorio de notas y pasa a comportarse como expediente clinico auditado y defendible.