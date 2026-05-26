const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
const localBaseUrl = String(
  process.env.BUCKETS_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:3000",
)
  .trim()
  .replace(/\/+$/, "");

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
          forcePathStyle: true,
        });
        this.bucketName = r2BucketName;
        this.publicBaseUrl = normalizeBaseUrl(r2PublicUrl);
        this.useR2 = true;
      } catch (error) {
        console.warn(
          "[StorageService] No se pudo inicializar Cloudflare R2. Se usará almacenamiento local.",
        );
      }
    } else if (hasAnyR2Value()) {
      throw new Error(
        "[StorageService] Configuración incompleta de R2. Debes definir R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL y al menos uno de R2_ACCOUNT_ID o R2_ENDPOINT.",
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

  /**
   * Sube un buffer de imagen a R2 o Local y devuelve la URL
   */
  async uploadImage(buffer, originalName) {
    const extension = this.getExtension(originalName);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const contentType = this.getMimeType(extension);

    if (this.useR2) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      return `${this.publicBaseUrl}/${fileName}`;
    }

    // Local Save
    const filePath = path.join(this.uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `${localBaseUrl}/uploads/${fileName}`;
  }

  getExtension(originalName) {
    const normalizedName = String(originalName || "").trim();
    const parts = normalizedName.split(".");

    if (parts.length < 2) {
      return "bin";
    }

    return parts.pop().toLowerCase();
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
