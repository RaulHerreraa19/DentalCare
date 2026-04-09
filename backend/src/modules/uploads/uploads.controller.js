const multer = require('multer');
const StorageService = require('../../services/storage.service');
const ApiResponse = require('../../utils/apiResponse');

const upload = multer({ storage: multer.memoryStorage() });

class UploadsController {
  static async uploadSignature(req, res, next) {
    try {
      if (!req.file && !req.body.base64) {
        return ApiResponse.error(res, 'No se proporcionó ninguna imagen', 400);
      }

      let buffer;
      let originalName = 'signature.png';

      if (req.file) {
        buffer = req.file.buffer;
        originalName = req.file.originalname;
      } else {
        // Manejar base64 desde el SignatureCanvas
        const base64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      }

      const url = await StorageService.uploadImage(buffer, originalName);
      return ApiResponse.success(res, 'Imagen subida exitosamente', { url });
    } catch (error) {
      next(error);
    }
  }

  static async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'Archivo no proporcionado', 400);
      }

      const url = await StorageService.uploadImage(req.file.buffer, req.file.originalname);
      return ApiResponse.success(res, 'Logo subido exitosamente', { url });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { UploadsController, upload };
