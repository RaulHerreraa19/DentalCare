const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'dentalcare-assets';

class StorageService {
  constructor() {
    this.useAzure = !!azureConnectionString;
    if (this.useAzure) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(containerName);
    } else {
      // Local setup
      this.uploadDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  /**
   * Sube un buffer de imagen a Azure o Local y devuelve la URL
   */
  async uploadImage(buffer, originalName) {
    const extension = originalName.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;

    if (this.useAzure) {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: this.getMimeType(extension) }
      });
      return blockBlobClient.url;
    } else {
      // Local Save
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      // Devolver URL relativa que el servidor estático servirá
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${fileName}`;
    }
  }

  getMimeType(extension) {
    const mimes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp'
    };
    return mimes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

module.exports = new StorageService();
