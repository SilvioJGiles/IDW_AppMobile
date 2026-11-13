import type { Coordenadas, Lugar } from '../tipos';

/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function lugarMasCercano(
  pos: Coordenadas,
  lugares: Lugar[],
  radioMetros: number,
): { lugar: Lugar; metros: number } | null {
  let mejor: { lugar: Lugar; metros: number } | null = null;
  for (const lugar of lugares) {
    if (!lugar.activo) continue;
    const metros = distanciaMetros(pos, lugar.coordenadas);
    if (metros <= radioMetros && (!mejor || metros < mejor.metros)) mejor = { lugar, metros };
  }
  return mejor;
}
