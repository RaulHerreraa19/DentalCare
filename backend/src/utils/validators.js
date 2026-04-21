const AppError = require("./AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const PHONE_ALLOWED_CHARS_REGEX = /^\+?[\d\s().-]+$/;
const PHONE_DIGITS_REGEX = /^\d{8,15}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizePhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};

const sanitizeText = (value) => String(value || "").trim();

const assertRequiredText = (value, fieldLabel, min = 2, max = 100) => {
  const sanitized = sanitizeText(value);
  if (!sanitized) {
    throw new AppError(`${fieldLabel} es obligatorio.`, 400);
  }
  if (sanitized.length < min || sanitized.length > max) {
    throw new AppError(
      `${fieldLabel} debe tener entre ${min} y ${max} caracteres.`,
      400,
    );
  }
  return sanitized;
};

const assertOptionalText = (value, fieldLabel, max = 255) => {
  if (value === undefined || value === null || value === "") return null;
  const sanitized = sanitizeText(value);
  if (sanitized.length > max) {
    throw new AppError(`${fieldLabel} no debe exceder ${max} caracteres.`, 400);
  }
  return sanitized;
};

const assertEmail = (value, fieldLabel = "El correo electrónico") => {
  const normalized = normalizeEmail(value);
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    throw new AppError(`${fieldLabel} no tiene un formato válido.`, 400);
  }
  return normalized;
};

const assertOptionalEmail = (value, fieldLabel = "El correo electrónico") => {
  if (value === undefined || value === null || value === "") return null;
  return assertEmail(value, fieldLabel);
};

const assertStrongPassword = (value, fieldLabel = "La contraseña") => {
  const password = String(value || "");
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new AppError(
      `${fieldLabel} debe tener entre 8 y 64 caracteres, incluyendo mayúscula, minúscula, número y símbolo.`,
      400,
    );
  }
  return password;
};

const assertPhone = (value, fieldLabel = "El teléfono") => {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new AppError(`${fieldLabel} es obligatorio.`, 400);
  }
  if (!PHONE_ALLOWED_CHARS_REGEX.test(raw)) {
    throw new AppError(`${fieldLabel} contiene caracteres inválidos.`, 400);
  }
  const digits = raw.replace(/\D/g, "");
  if (!PHONE_DIGITS_REGEX.test(digits)) {
    throw new AppError(`${fieldLabel} debe tener entre 8 y 15 dígitos.`, 400);
  }
  return `+${digits}`;
};

const assertOptionalPhone = (value, fieldLabel = "El teléfono") => {
  if (value === undefined || value === null || value === "") return null;
  return assertPhone(value, fieldLabel);
};

const assertSlug = (value, fieldLabel = "El slug") => {
  const slug = sanitizeText(value).toLowerCase();
  if (!slug || !SLUG_REGEX.test(slug)) {
    throw new AppError(
      `${fieldLabel} debe contener solo minúsculas, números y guiones medios.`,
      400,
    );
  }
  return slug;
};

module.exports = {
  EMAIL_REGEX,
  STRONG_PASSWORD_REGEX,
  PHONE_ALLOWED_CHARS_REGEX,
  PHONE_DIGITS_REGEX,
  normalizeEmail,
  normalizePhone,
  sanitizeText,
  assertRequiredText,
  assertOptionalText,
  assertEmail,
  assertOptionalEmail,
  assertStrongPassword,
  assertPhone,
  assertOptionalPhone,
  assertSlug,
};
