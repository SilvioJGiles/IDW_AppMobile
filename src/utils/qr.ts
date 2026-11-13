// Formato del cartel (D5/R6 de la API): "COLON:<id del lugar>", por ejemplo "COLON:lug-004".
// Se toleran espacios y saltos de línea alrededor, que agregan algunos lectores.
const PREFIJO = 'COLON:';
const ID_DE_LUGAR = /^lug-[A-Za-z0-9_-]{1,36}$/;

/** Devuelve el id del lugar o null si el texto NO es un QR de Mi Ciudad (URL, otro sistema, QR roto). */
export function leerCodigoQr(texto: string): string | null {
  const limpio = (texto ?? '').trim();
  if (!limpio.startsWith(PREFIJO)) return null;
  const id = limpio.slice(PREFIJO.length);
  return ID_DE_LUGAR.test(id) ? id : null;
}
