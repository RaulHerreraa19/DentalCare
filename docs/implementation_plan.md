Plan de Implementación y Mejoras de Cumplimiento Legal y UI/UX (NOM-004, NOM-015, NOM-024)
Este documento detalla el plan propuesto para implementar las mejoras normativas, solucionar los problemas de persistencia y visualización del historial (odontogramas y notas de consultas anteriores), y rediseñar la UI/UX del frontend de DentalCare separando el expediente clínico permanente de la evolución diaria de consultas, garantizando una navegación fluida bidireccional y blindando la seguridad de datos críticos como las alergias.

User Review Required
IMPORTANT

Cambios en el esquema de base de datos: Se añadirá el campo curp en el modelo Patient. Esto requerirá ejecutar una migración de Prisma (npx prisma migrate dev).

Pistas de Auditoría Obligatorias (NOM-024): Se añadirá el registro automático del log de auditoría con la acción VIEW cada vez que un doctor acceda al expediente de un paciente. Esto es estrictamente obligatorio para cumplir con la auditoría de accesos a datos confidenciales en México.

Regla de Negocio para Alergias (NOM-004 / Seguridad del Paciente): Una vez que se registra una alergia, no puede ser eliminada ni editada para borrarse. El sistema solo permitirá añadir nuevas alergias o notas adicionales (flujo acumulativo o de append).

Open Questions
NOTE

¿El formato de CURP debe estar validado estrictamente con Regex en el frontend? Recomendación: Implementar una validación de 18 caracteres alfanuméricos con la estructura oficial mexicana en el frontend y backend para prevenir errores de captura.

¿Deseas que los signos vitales históricos de consultas anteriores también se grafiquen o muestren en una tabla comparativa de evolución en la sección de consultas pasadas? Recomendación: Sí, mostrar una pequeña tabla comparativa de signos vitales históricos en el panel lateral de consultas para identificar rápidamente tendencias de hipertensión o problemas sistémicos (NOM-015).

Proposed Changes
1. Base de Datos (Cumplimiento NOM-024 y Registro de Alergias)
[MODIFY] 
schema.prisma
Añadir el campo opcional curp de tipo String? con restricción @unique en el modelo Patient para cumplir con la identificación unívoca nacional requerida por la NOM-024-SSA3-2012.
prisma

model Patient {
  // ... campos actuales
  phone             String    // Usado para WhatsApp
  curp              String?   @unique // Identificación única mexicana (NOM-024)
  date_of_birth     DateTime?
  // ... resto de campos
}
2. Backend (Log de Visualización, Persistencia del Historial y Restricción de Alergias)
[MODIFY] 
medical-records.controller.js
En los controladores de obtención de expedientes e historial (getRecord y getHistory), integrar el registro automático de logs de auditoría para la acción VIEW sobre el recurso del expediente clínico.
Esto registra de forma inalterable quién consultó el expediente, cuándo, desde qué IP y qué navegador (cumpliendo con la NOM-024).
[MODIFY] 
medical-records.service.js
Blindaje en Alergias: En el método updateRecord, validar que el texto de allergies no remueva información previa. Si se intenta guardar un texto que no contenga las alergias registradas con anterioridad, el backend arrojará un error de validación o automáticamente concatenará la información nueva, impidiendo el borrado físico de alertas de salud.
Asegurar que updateRecord maneje de forma robusta la persistencia de cambios en el odontograma y no duplique registros vacíos.
Optimizar la respuesta de getHistory para garantizar que la lista completa de odontograms (histórico de odontogramas) y notes (consultas históricas) se retorne correctamente ordenada de forma descendente por fecha.
3. Frontend (UI/UX, Separación de Contextos, Navegación Bidireccional y Flujo de Alergias)
[MODIFY] 
Patients.jsx
Agregar el campo de entrada "CURP" en el formulario de creación y edición de pacientes, con validación básica de formato (18 caracteres en mayúsculas).
[MODIFY] 
MedicalRecordEditor.jsx
Rediseño UI/UX de Separación de Contextos:
Reestructurar el panel principal dividiéndolo en dos áreas claras mediante pestañas estilizadas o tarjetas visuales:
Ficha Clínica y Antecedentes (Permanente): Ficha de Identificación (ahora mostrando el CURP prominentemente), Antecedentes Heredofamiliares, Patológicos, No Patológicos, Quirúrgicos, Alergias y Consentimientos Firmados.
Consulta y Sesión Clínica (Evolución Diaria): Nota de evolución de la cita activa, signos vitales tomados hoy, procedimientos realizados en la sesión, honorarios de hoy y receta electrónica.
Flujo de Navegación Interconectada (Consulta <-> Expediente Completo):
Si se inicia el modo "Consulta Activa", el sistema mostrará la Nota de Evolución por defecto.
Añadir un banner superior prominente de estado: "Consulta en Curso de [Nombre Paciente]" con un botón de acceso instantáneo: "Ver Expediente Clínico Completo".
Una vez que el médico da clic en "Ver Expediente Clínico Completo", se despliegan todos los antecedentes permanentes, pero se añade un botón flotante y un Tab fijo llamado "Regresar a Consulta de Hoy". Esto permite al médico navegar fluidamente entre el historial del paciente y su nota de sesión actual sin perder información en progreso.
Control de Seguridad de Alergias (Apendizable):
Mostrar las alergias existentes en un formato Solo Lectura muy visible y con una etiqueta de alerta de alto riesgo.
Proporcionar un campo de texto adicional llamado "Añadir Alergia o Alerta Médica". Al escribir allí y guardar, el sistema anexará la nueva información al registro histórico con la fecha y firma del médico, impidiendo que se borre lo anteriormente capturado.
Integración del Historial de Consultas Anteriores:
Crear una sección llamada "Línea del Tiempo de Evolución" en la pestaña de consultas históricas.
Renderizar la lista de notes históricas mostrando la fecha, el médico que atendió, y el contenido completo de lo realizado, con opción de búsqueda o filtrado.
Integración del Odontograma Histórico Interactivo:
En la pestaña del Odontograma, añadir un control para seleccionar versiones de odontogramas anteriores.
Si el doctor selecciona un odontograma del historial, el componente visual del odontograma cambiará temporalmente a modo lectura histórica, permitiendo ver visualmente el estado de la dentadura del paciente en esa fecha exacta.
Verification Plan
Automated & Manual Tests
Prisma Migrations:
Ejecutar npx prisma migrate dev --name add_curp_to_patient en el directorio de backend para asegurar la actualización del esquema.
Registro de logs de VIEW:
Abrir un expediente clínico desde el frontend como médico.
Verificar en la base de datos que se generó un log con la acción VIEW que incluya el user_id del doctor y el patient_id.
Prueba de Inmutabilidad de Alergias:
Registrar una alergia ("Alergia a la Penicilina"). Guardar.
Intentar editar el campo de alergias borrando el texto anterior. Validar que el sistema impida el guardado o lo concatene de forma automática, manteniendo "Alergia a la Penicilina" intacto.
Navegación Bidireccional:
Iniciar consulta de prueba, presionar "Ver Expediente Completo", navegar por las pestañas de antecedentes, presionar "Regresar a Consulta" y comprobar que la nota de evolución que se estaba escribiendo sigue intacta y lista para ser guardada.