const db = require('../../config/database');

class AuditLogService {
  /**
   * Registra una acción en la bitácora de auditoría.
   */
  static async log({ userId, action, targetModel, targetId, metadata }) {
    try {
      return await db.auditLog.create({
        data: {
          user_id: userId,
          action,
          target_model: targetModel,
          target_id: targetId,
          metadata: metadata || {}
        }
      });
    } catch (error) {
      // No bloqueamos la operación principal por fallas en logs, pero informamos
      console.error('CRITICAL: Failed to write audit log', error);
    }
  }

  /**
   * Obtiene la trazabilidad de un registro específico.
   */
  static async getHistory(targetModel, targetId) {
    return await db.auditLog.findMany({
      where: {
        target_model: targetModel,
        target_id: targetId
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            role: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
}

module.exports = AuditLogService;
