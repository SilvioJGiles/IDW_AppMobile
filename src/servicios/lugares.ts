// Servicio de lugares: la única puerta a los datos de los lugares para toda la app.
// Usa el cliente de la API (./cliente.ts, con fetch): GET /lugares y GET /lugares/:id.
//
// Guarda una copia del catálogo en el teléfono (expo-sqlite/kv-store): sin señal
// (por ejemplo en El Palmar) se sigue viendo la última lista descargada.
// La búsqueda y el filtro por categoría se hacen en memoria (filtrarLugares).

import Storage from "expo-sqlite/kv-store";

import type { Lugar } from "../tipos";
import { ErrorApi, ErrorRed, pedir, pedirLista } from "./cliente";

const CLAVE = "mc_lugares_cache";
let memoria: Map<string, Lugar> | null = null;

async function cargarCache(): Promise<Map<string, Lugar>> {
  if (memoria) return memoria;
  memoria = new Map();
  try {
    const crudo = await Storage.getItem(CLAVE);
    if (crudo) for (const l of JSON.parse(crudo) as Lugar[]) memoria.set(l.id, l);
  } catch {
    /* copia ilegible: se ignora y se vuelve a bajar */
  }
  return memoria;
}

/** Lista de lugares activos. Sin señal devuelve la última copia guardada. */
export async function listarLugares(): Promise<Lugar[]> {
  const cache = await cargarCache();
  try {
    const lugares = await pedirLista<Lugar>("/lugares?porPagina=100");
    cache.clear();
    lugares.forEach((l) => cache.set(l.id, l));
    await Storage.setItem(CLAVE, JSON.stringify(lugares));
    return lugares.filter((l) => l.activo);
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

// ---- Búsqueda y filtro del catálogo (en memoria, sin volver a pedir a la API) ----

export interface FiltroLugares {
  texto?: string;
  categoriaId?: string | null;
}

/** Sin tildes ni mayúsculas, para buscar "museo" y encontrar "Museo". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function filtrarLugares(lugares: Lugar[], filtro: FiltroLugares): Lugar[] {
  const termino = normalizarTexto(filtro.texto ?? "");

  return lugares.filter((lugar) => {
    const coincideCategoria = !filtro.categoriaId || lugar.categoriaId === filtro.categoriaId;
    const coincideTexto = termino.length === 0 || normalizarTexto(lugar.nombre).includes(termino);

    return lugar.activo && coincideCategoria && coincideTexto;
  });
}
