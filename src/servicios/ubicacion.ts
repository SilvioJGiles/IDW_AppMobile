import * as Location from 'expo-location';
import type { Coordenadas } from '../tipos';

export type ResultadoPosicion =
  | { ok: true; coordenadas: Coordenadas }
  | { ok: false; motivo: 'denegado' | 'sin-gps' };

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

// Fórmula de Haversine para la función "Cerca Tuyo"
export function calcularDistanciaKm(coord1: Coordenadas, coord2: Coordenadas): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.latitud - coord1.latitud) * Math.PI / 180;
  const dLon = (coord2.longitud - coord1.longitud) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.latitud * Math.PI / 180) * Math.cos(coord2.latitud * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

