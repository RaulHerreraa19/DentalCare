const UsersService = require('./users.service');
const ApiResponse = require('../../utils/apiResponse');

class UsersController {
  static async invite(req, res, next) {
    try {
      const employee = await UsersService.inviteEmployee(req.user.organization_id, req.body);
      return ApiResponse.success(res, 'Empleado invitado exitosamente', { id: employee.id, email: employee.email }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getTeam(req, res, next) {
    try {
      const team = await UsersService.getEmployees(req.user.organization_id);
      return ApiResponse.success(res, 'Equipo obtenido', team);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req, res, next) {
    try {
      const updatedUser = await UsersService.updateEmployee(req.user.organization_id, req.params.id, req.body);
      return ApiResponse.success(res, 'Empleado actualizado exitosamente', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const updatedUser = await UsersService.updateMe(req.user.id, req.body);
      return ApiResponse.success(res, 'Perfil actualizado correctamente', updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UsersController;
