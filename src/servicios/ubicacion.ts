import * as Location from 'expo-location';
import type { Coordenadas } from '../tipos';

export type ResultadoPosicion =
  | { ok: true; coordenadas: Coordenadas }
  | { ok: false; motivo: 'denegado' | 'sin-gps' };

/** Pide el permiso (sólo mientras se usa la app) y devuelve la posición. Nunca lanza. */
export async function obtenerPosicion(): Promise<ResultadoPosicion> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return { ok: false, motivo: 'denegado' };
    const pos =
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })) ??
      (await Location.getLastKnownPositionAsync());
    if (!pos) return { ok: false, motivo: 'sin-gps' };
    return { ok: true, coordenadas: { latitud: pos.coords.latitude, longitud: pos.coords.longitude } };
  } catch {
    return { ok: false, motivo: 'sin-gps' };
  }
}
