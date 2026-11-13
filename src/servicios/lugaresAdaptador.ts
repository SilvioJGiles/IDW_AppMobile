import Storage from 'expo-sqlite/kv-store';
import type { Lugar } from '../tipos';
import { ErrorApi, ErrorRed, pedir, pedirLista } from './cliente';

// ⚠️ ADAPTAR: este archivo es un mínimo para que mi módulo funcione solo.
// Si el compañero del catálogo ya tiene `obtenerLugar` / `listarLugares` con caché,
// borrá este archivo y cambiá los imports de las pantallas por su servicio.

const CLAVE = 'mc_lugares_cache';
let memoria: Map<string, Lugar> | null = null;

async function cargarCache(): Promise<Map<string, Lugar>> {
  if (memoria) return memoria;
  memoria = new Map();
  try {
    const crudo = await Storage.getItem(CLAVE);
    if (crudo) for (const l of JSON.parse(crudo) as Lugar[]) memoria.set(l.id, l);
  } catch {
    /* caché ilegible: se ignora y se vuelve a bajar */
  }
  return memoria;
}

/** Lista de lugares activos. Sin señal devuelve la última copia guardada. */
export async function listarLugares(): Promise<Lugar[]> {
  const cache = await cargarCache();
  try {
    const lugares = await pedirLista<Lugar>('/lugares?porPagina=500');
    cache.clear();
    lugares.forEach((l) => cache.set(l.id, l));
    await Storage.setItem(CLAVE, JSON.stringify(lugares));
    return lugares;
  } catch (e) {
    if (e instanceof ErrorRed && cache.size > 0) return [...cache.values()].filter((l) => l.activo);
    throw e;
  }
}

/** Un lugar por id; null si no existe o está dado de baja. Lanza ErrorRed si no hay señal ni copia. */
export async function obtenerLugar(id: string): Promise<Lugar | null> {
  const cache = await cargarCache();
  const local = cache.get(id);
  if (local) return local.activo ? local : null;
  try {
    const lugar = await pedir<Lugar>(`/lugares/${encodeURIComponent(id)}`);
    if (!lugar || !lugar.activo) return null;
    cache.set(lugar.id, lugar);
    return lugar;
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 404) return null;
    throw e;
  }
}
