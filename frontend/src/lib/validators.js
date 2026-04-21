export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
export const PHONE_ALLOWED_CHARS_REGEX = /^\+?[\d\s().-]+$/;
export const PHONE_DIGITS_REGEX = /^\d{8,15}$/;

export const normalizeEmail = (value = "") =>
  String(value).trim().toLowerCase();

export const normalizePhone = (value = "") => {
  const raw = String(value).trim();
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};

export const isValidEmail = (value = "") =>
  EMAIL_REGEX.test(normalizeEmail(value));

export const isStrongPassword = (value = "") =>
  STRONG_PASSWORD_REGEX.test(String(value));

export const isValidPhone = (value = "") => {
  const raw = String(value).trim();
  if (!raw || !PHONE_ALLOWED_CHARS_REGEX.test(raw)) return false;
  return PHONE_DIGITS_REGEX.test(raw.replace(/\D/g, ""));
};
