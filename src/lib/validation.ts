/** Deja solo los dígitos (saca espacios, guiones, paréntesis, +). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida un teléfono de forma laxa: entre 8 y 15 dígitos (cubre números
 * argentinos locales y con código de país +54 9, y también extranjeros).
 */
export function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 8 && digits.length <= 15;
}

export const PHONE_HINT = "Ingresá un teléfono válido (mínimo 8 dígitos).";
