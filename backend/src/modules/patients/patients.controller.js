const PatientsService = require("./patients.service");
const ApiResponse = require("../../utils/apiResponse");

const shouldEmitPatientsTelemetry = process.env.NODE_ENV !== "test";
let hasWarnedIgnoredPaginationParamsInLegacy = false;

class PatientsController {
  static async createPatient(req, res, next) {
    try {
      const { first_name, last_name, phone } = req.body;
      if (!first_name || !last_name || !phone) {
        return res.status(400).json({
          status: "fail",
          message: "Nombre, apellidos y teléfono son obligatorios",
        });
      }

      const patient = await PatientsService.createPatient(
        req.user.organization_id,
        req.body,
      );
      return ApiResponse.success(
        res,
        "Paciente creado exitosamente",
        patient,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPatients(req, res, next) {
    try {
      const startedAt = Date.now();
      const result = await PatientsService.getPatients(
        req.user.organization_id,
        req.query,
      );
      const elapsedMs = Date.now() - startedAt;

      res.setHeader("X-Patients-Mode", result.mode);

      if (result.mode === "legacy") {
        // Header temporal para monitorear consumidores pendientes de migrar.
        res.setHeader("X-Patients-Legacy-Mode", "true");
      }

      if (shouldEmitPatientsTelemetry) {
        const telemetryBase = {
          mode: result.mode,
          org: req.user.organization_id,
          tookMs: elapsedMs,
          ...result.telemetry,
        };
        console.info("[telemetry] patients.list", telemetryBase);

        if (
          result.mode === "legacy" &&
          result.telemetry?.ignoredPaginationParams &&
          !hasWarnedIgnoredPaginationParamsInLegacy
        ) {
          console.warn(
            "[rollout-warning] patients.list received pagination params in legacy mode; params are ignored unless mode=paginated",
          );
          hasWarnedIgnoredPaginationParamsInLegacy = true;
        }
      }

      return ApiResponse.success(
        res,
        "Lista de pacientes obtenida",
        result.data,
      );
    } catch (error) {
      if (shouldEmitPatientsTelemetry) {
        console.warn("[telemetry] patients.list.error", {
          org: req.user?.organization_id,
          mode: req.query?.mode || "legacy",
          message: error.message,
          statusCode: error.statusCode || 500,
        });
      }
      next(error);
    }
  }

  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientsService.getPatientById(
        req.user.organization_id,
        id,
      );
      return ApiResponse.success(res, "Detalle del paciente obtenido", patient);
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientsService.updatePatient(
        req.user.organization_id,
        id,
        req.body,
      );
      return ApiResponse.success(
        res,
        "Paciente actualizado exitosamente",
        patient,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientsController;
