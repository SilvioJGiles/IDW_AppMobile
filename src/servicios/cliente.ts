import { API_URL } from './config';
import { obtenerSesion } from './sesion';

/** La API respondió con un error del "sobre": { error: { codigo, mensaje } }. */
export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly estado: number,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/** No hubo respuesta: sin señal, timeout, servidor dormido. */
export class ErrorRed extends Error {
  constructor(mensaje = 'No hay conexión con el servidor.') {
    super(mensaje);
    this.name = 'ErrorRed';
  }
}

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  cuerpo?: unknown; // objeto JSON
  formData?: FormData; // para POST /archivos
  conSesion?: boolean;
  timeoutMs?: number;
}

/** Devuelve `datos` del sobre, o null si la respuesta es 204. */
export async function pedir<T>(ruta: string, op: Opciones = {}): Promise<T | null> {
  const { metodo = 'GET', cuerpo, formData, conSesion = false, timeoutMs = 30_000 } = op;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (conSesion) {
    const sesion = await obtenerSesion();
    if (!sesion) throw new ErrorApi('NO_AUTENTICADO', 'Tenés que ingresar con tu cuenta para hacer esto.', 401);
    headers.Authorization = `Bearer ${sesion.token}`;
  }
  let body: BodyInit | undefined;
  if (formData) body = formData; // NO setear Content-Type: fetch agrega el boundary
  else if (cuerpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, { method: metodo, headers, body, signal: control.signal });
  } catch {
    throw new ErrorRed();
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    if (res.ok) return null;
  }
  if (!res.ok) {
    const e = json?.error;
    throw new ErrorApi(e?.codigo ?? 'ERROR_INTERNO', e?.mensaje ?? 'Algo salió mal. Probá de nuevo.', res.status);
  }
  return (json?.datos ?? null) as T | null;
}

export async function pedirLista<T>(ruta: string, conSesion = false): Promise<T[]> {
  const datos = await pedir<T[]>(ruta, { conSesion });
  return datos ?? [];
}
