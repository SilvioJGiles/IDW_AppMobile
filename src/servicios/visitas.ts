import type { OrigenVisita, Visita } from '../tipos';
import { ErrorApi, ErrorRed, pedir, pedirLista } from './cliente';
import { guardarFotoLocal, existeFoto } from './fotos';
import { obtenerSesion } from './sesion';
import {
  guardarErrorSync,
  guardarFotoRemota,
  insertarLocal,
  marcarSubida,
  mezclarDelServidor,
  obtenerLocal,
  pendientes,
  type VisitaLocal,
} from './visitasLocal';
import { isoConZona } from '../utils/fechas';

export const LARGO_MAXIMO_NOTA = 280; // el servidor rechaza más

export class ErrorValidacion extends Error {}

function nuevoId(): string {
  // Cumple /^vis-[A-Za-z0-9_-]{3,36}$/ de la API. El id lo genera el teléfono => el POST es idempotente.
  return `vis-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface DatosVisita {
  lugarId: string;
  origen: OrigenVisita;
  /** uri temporal que devolvió la cámara o la galería (se copia a un lugar permanente) */
  fotoTemporal: string | null;
  nota: string | null;
}

/**
 * Registra la visita LOCAL-PRIMERO: se guarda en SQLite y se intenta subir en segundo plano.
 * Con o sin señal, el turista ve su visita al instante.
 */
export async function registrarVisita(datos: DatosVisita): Promise<VisitaLocal> {
  if (!datos.lugarId) throw new ErrorValidacion('Falta elegir el lugar.');
  const nota = datos.nota?.trim() ? datos.nota.trim() : null;
  if (nota && nota.length > LARGO_MAXIMO_NOTA) {
    throw new ErrorValidacion(`La nota puede tener hasta ${LARGO_MAXIMO_NOTA} caracteres.`);
  }

  const id = nuevoId();
  const sesion = await obtenerSesion();
  const fotoLocal = datos.fotoTemporal ? guardarFotoLocal(id, datos.fotoTemporal) : null;
  await insertarLocal({
    id,
    usuarioId: sesion?.usuarioId ?? 'anonimo',
    lugarId: datos.lugarId,
    fechaHora: isoConZona(),
    origen: datos.origen,
    fotoLocal,
    nota,
  });

  void sincronizar().catch(() => undefined); // sin esperar: si falla, queda pendiente
  return (await obtenerLocal(id)) as VisitaLocal;
}

async function subirFoto(uri: string): Promise<string> {
  const form = new FormData();
  // React Native acepta este objeto en lugar de un Blob.
  form.append('archivo', { uri, name: 'visita.jpg', type: 'image/jpeg' } as unknown as Blob);
  const r = await pedir<{ url: string }>('/archivos', { metodo: 'POST', formData: form, conSesion: true, timeoutMs: 90_000 });
  if (!r?.url) throw new ErrorApi('ERROR_INTERNO', 'La API no devolvió la URL de la foto.', 500);
  return r.url;
}

async function enviar(v: VisitaLocal): Promise<void> {
  // 1) Foto primero (la API exige una URL que salga de POST /archivos).
  let foto = v.fotoRemota;
  if (!foto && v.fotoLocal && existeFoto(v.fotoLocal)) {
    foto = await subirFoto(v.fotoLocal);
    await guardarFotoRemota(v.id, foto); // si el POST falla, no se vuelve a subir la foto
  }
  // 2) La visita: POST la primera vez, PATCH si sólo cambió foto o nota.
  if (!v.enServidor) {
    await pedir<Visita>('/yo/visitas', {
      metodo: 'POST',
      conSesion: true,
      cuerpo: { id: v.id, lugarId: v.lugarId, fechaHora: v.fechaHora, origen: v.origen, fotoUri: foto, nota: v.nota },
    });
  } else {
    await pedir<Visita>(`/yo/visitas/${encodeURIComponent(v.id)}`, {
      metodo: 'PATCH',
      conSesion: true,
      cuerpo: { fotoUri: foto, nota: v.nota },
    });
  }
  await marcarSubida(v.id);
}

let enCurso: Promise<ResultadoSync> | null = null;

export interface ResultadoSync {
  enviadas: number;
  pendientes: number;
  sinSesion: boolean;
}

/** Sube la cola. Si ya hay una corriendo, devuelve esa misma (evita duplicados por doble disparo). */
export function sincronizar(): Promise<ResultadoSync> {
  enCurso ??= correrSync().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function correrSync(): Promise<ResultadoSync> {
  const sesion = await obtenerSesion();
  const cola = await pendientes();
  if (!sesion) return { enviadas: 0, pendientes: cola.length, sinSesion: true };

  let enviadas = 0;
  for (const v of cola) {
    try {
      await enviar(v);
      enviadas++;
    } catch (e) {
      if (e instanceof ErrorRed) break; // sin señal: se reintenta cuando vuelva
      if (e instanceof ErrorApi) {
        if (e.estado === 401 || e.estado >= 500) break; // sesión vencida o servidor caído: parar
        if (e.codigo === 'FECHA_EN_EL_FUTURO') continue; // reloj desfasado: reintentar después
        await guardarErrorSync(v.id, e.message); // error permanente (lugar inexistente, datos inválidos…)
        continue;
      }
      break;
    }
  }
  return { enviadas, pendientes: (await pendientes()).length, sinSesion: false };
}

/** Cambio de teléfono: baja el recorrido guardado en la cuenta y lo mezcla con el local. */
export async function descargarRecorrido(): Promise<number> {
  if (!(await obtenerSesion())) return 0;
  const remotas = await pedirLista<Visita>('/yo/visitas?porPagina=500', true);
  return mezclarDelServidor(remotas);
}
