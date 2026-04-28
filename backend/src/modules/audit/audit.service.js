const db = require("../../config/database");

class AuditLogService {
  /**
   * Registra una acción en la bitácora de auditoría.
   */
  static async log({
    userId,
    action,
    targetModel,
    targetId,
    organizationId,
    patientId,
    resourceType,
    resourceId,
    accessGranted,
    ipAddress,
    userAgent,
    beforeSnapshot,
    afterSnapshot,
    reason,
    metadata,
  }) {
    try {
      return await db.auditLog.create({
        data: {
          user_id: userId,
          action,
          target_model: targetModel,
          target_id: targetId,
          organization_id: organizationId,
          patient_id: patientId,
          resource_type: resourceType,
          resource_id: resourceId,
          access_granted: accessGranted,
          ip_address: ipAddress,
          user_agent: userAgent,
          before_snapshot: beforeSnapshot,
          after_snapshot: afterSnapshot,
          reason,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      // No bloqueamos la operación principal por fallas en logs, pero informamos
      console.error("CRITICAL: Failed to write audit log", error);
    }
  }

  /**
   * Obtiene la trazabilidad de un registro específico.
   */
  static async getHistory(targetModel, targetId) {
    return await db.auditLog.findMany({
      where: {
        target_model: targetModel,
        target_id: targetId,
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }
}

module.exports = AuditLogService;
