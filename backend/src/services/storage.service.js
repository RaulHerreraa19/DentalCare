const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const AppError = require("../utils/AppError");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const r2AccountId = String(process.env.R2_ACCOUNT_ID || "").trim();
const r2AccessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim();
const r2SecretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim();
const r2BucketName = String(process.env.R2_BUCKET_NAME || "").trim();
const r2PublicUrl = String(process.env.R2_PUBLIC_URL || "").trim();
const r2Endpoint = String(process.env.R2_ENDPOINT || "").trim();
const r2Region = String(process.env.R2_REGION || "auto").trim() || "auto";

function hasR2Configuration() {
  return Boolean(
    r2AccessKeyId &&
    r2SecretAccessKey &&
    r2BucketName &&
    r2PublicUrl &&
    (r2AccountId || r2Endpoint),
  );
}

function hasAnyR2Value() {
  return Boolean(
    r2AccountId ||
    r2AccessKeyId ||
    r2SecretAccessKey ||
    r2BucketName ||
    r2PublicUrl ||
    r2Endpoint,
  );
}

function normalizeBaseUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

function buildUrl(baseUrl, filePath) {
  const normalizedPath = String(filePath || "").replace(/^\/+/, "");
  const normalizedBase = normalizeBaseUrl(baseUrl);

  if (!normalizedBase) {
    return `/${normalizedPath}`;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

class StorageService {
  constructor() {
    this.useR2 = false;

    if (hasR2Configuration()) {
      try {
        this.s3Client = new S3Client({
          region: r2Region,
          endpoint:
            r2Endpoint || `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
          },
        });
        this.bucketName = r2BucketName;
        this.publicBaseUrl = normalizeBaseUrl(r2PublicUrl);
        this.useR2 = true;
        console.info(
          `[StorageService] Cloudflare R2 inicializado correctamente. Bucket=${this.bucketName} PublicUrl=${this.publicBaseUrl}`,
        );
      } catch (error) {
        console.warn(
          `[StorageService] No se pudo inicializar Cloudflare R2. Se usará almacenamiento local. Error=${error.message}`,
        );
      }
    } else if (hasAnyR2Value()) {
      console.warn(
        "[StorageService] Configuración R2 incompleta. Se usará almacenamiento local hasta que definas R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL y al menos uno de R2_ACCOUNT_ID o R2_ENDPOINT.",
      );
    }

    if (!this.useR2) {
      // Local setup
      this.uploadDir = path.join(__dirname, "../public/uploads");
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  isR2Enabled() {
    return this.useR2;
  }

  /**
   * Sube un buffer de imagen a R2 o Local y devuelve la URL
   */
  async uploadImage(buffer, originalName, folder = "") {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new AppError("El archivo está vacío o no es válido.", 400);
    }

    const extension = this.getExtension(originalName);
    if (!this.isAllowedExtension(extension)) {
      throw new AppError(
        "Extensión no permitida. Solo se aceptan png, jpg, jpeg y webp.",
        400,
      );
    }

    const folderPath = this.normalizeFolder(folder);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const objectKey = `${folderPath}${fileName}`;
    const contentType = this.getMimeType(extension);

    if (this.useR2) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
            Body: buffer,
            ContentType: contentType,
          }),
        );

        return `${this.publicBaseUrl}/${objectKey}`;
      } catch (error) {
        console.error(
          `[StorageService] Error subiendo archivo a R2. Bucket=${this.bucketName} Key=${objectKey} Error=${error.message}`,
        );
        throw new AppError("No se pudo subir el archivo a Cloudflare R2.", 500);
      }
    }

    // Local Save
    const localFolder = path.join(this.uploadDir, folderPath);
    if (!fs.existsSync(localFolder)) {
      fs.mkdirSync(localFolder, { recursive: true });
    }

    const filePath = path.join(localFolder, fileName);
    fs.writeFileSync(filePath, buffer);
    return buildUrl(process.env.APP_BASE_URL || "", `/uploads/${objectKey}`);
  }

  getExtension(originalName) {
    const normalizedName = String(originalName || "").trim();
    const parts = normalizedName.split(".");

    if (parts.length < 2) {
      return "bin";
    }

    return parts.pop().toLowerCase();
  }

  isAllowedExtension(extension) {
    return ["png", "jpg", "jpeg", "webp"].includes(
      String(extension || "").toLowerCase(),
    );
  }

  normalizeFolder(folder) {
    const normalized = String(folder || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    if (!normalized) {
      return "";
    }

    if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i.test(normalized)) {
      throw new AppError("La carpeta de destino no es válida.", 400);
    }

    return `${normalized}/`;
  }

  getMimeType(extension) {
    const mimes = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };

    return (
      mimes[String(extension || "").toLowerCase()] || "application/octet-stream"
    );
  }
}

module.exports = new StorageService();
