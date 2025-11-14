/**
 * Utilidades para validar y trabajar con tipos de cartas
 */

/**
 * Verifica si un cardType es Adendei o Rava
 * Todas las cartas que contengan 'adendei' o 'rava' en el nombre se consideran Adendei
 * @param cardType - El tipo de carta a validar
 * @returns true si es Adendei o Rava, false en caso contrario
 */
export const isAdendeiOrRava = (cardType: string): boolean => {
  if (!cardType) return false;
  const lowerType = cardType.toLowerCase();
  return lowerType.includes('adendei') || lowerType.includes('rava');
};

/**
 * Verifica si un cardType es Rot
 * @param cardType - El tipo de carta a validar
 * @returns true si es Rot, false en caso contrario
 */
export const isRot = (cardType: string): boolean => {
  if (!cardType) return false;
  return cardType.toLowerCase() === 'rot';
};

/**
 * Verifica si un cardType es Ixim
 * @param cardType - El tipo de carta a validar
 * @returns true si es Ixim, false en caso contrario
 */
export const isIxim = (cardType: string): boolean => {
  if (!cardType) return false;
  return cardType.toLowerCase() === 'ixim';
};

/**
 * Verifica si un cardType es Bio
 * @param cardType - El tipo de carta a validar
 * @returns true si es Bio, false en caso contrario
 */
export const isBio = (cardType: string): boolean => {
  if (!cardType) return false;
  return cardType.toLowerCase() === 'bio';
};

/**
 * Verifica si un cardType es Protector
 * @param cardType - El tipo de carta a validar
 * @returns true si es Protector, false en caso contrario
 */
export const isProtector = (cardType: string): boolean => {
  if (!cardType) return false;
  return cardType.toLowerCase() === 'protector';
};

/**
 * Verifica si un cardType es solo Adendei (excluye Rava)
 * @param cardType - El tipo de carta a validar
 * @returns true si es Adendei (pero no Rava), false en caso contrario
 */
export const isAdendeiOnly = (cardType: string): boolean => {
  if (!cardType) return false;
  const lowerType = cardType.toLowerCase();
  return lowerType.includes('adendei');
};
