const OrganizationsService = require('./organizations.service');
const ApiResponse = require('../../utils/apiResponse');

class OrganizationsController {
  static async create(req, res, next) {
    try {
      const organization = await OrganizationsService.createOrganization(req.body);
      return ApiResponse.success(res, 'Negocio y Dueño creados exitosamente', organization, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const organizations = await OrganizationsService.getAllOrganizations();
      return ApiResponse.success(res, 'Negocios obtenidos exitosamente', organizations, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req, res, next) {
    try {
      console.log('Fetching Org Details for ID:', req.params.id);
      const organization = await OrganizationsService.getOrganizationDetails(req.params.id);
      return ApiResponse.success(res, 'Detalles del negocio recuperados', organization, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationsController;
