import Storage from 'expo-sqlite/kv-store';
import type { OrigenVisita } from '../tipos';

// Por qué existe este archivo:
// Para sacar la foto, la app le pasa el control a la app de Cámara de Android.
// Mientras la cámara está abierta, Android puede cerrar nuestra app para liberar
// memoria (pasa sobre todo en teléfonos con poca RAM). Al confirmar la foto, la app
// arranca de cero y se pierde todo lo que estaba en pantalla: el lugar, la nota y la foto.
//
// Solución: antes de abrir la cámara guardamos un "borrador" de la visita en kv-store.
// Si la app se reinicia, el borrador nos dice a qué pantalla volver, y
// ImagePicker.getPendingResultAsync() nos devuelve la foto que se había sacado.

const CLAVE = 'mc_borrador_visita';
// Si pasó más que esto, el usuario no "volvió de la cámara": abrió la app otro día.
// Ahí no lo llevamos a una visita vieja sin que lo pida.
const VIGENCIA_MS = 30 * 60 * 1000;

export interface BorradorVisita {
  lugarId: string;
  origen: OrigenVisita;
  nota: string;
}

export async function guardarBorrador(borrador: BorradorVisita): Promise<void> {
  await Storage.setItemAsync(CLAVE, JSON.stringify({ ...borrador, guardadoEn: Date.now() }));
}

export async function leerBorrador(): Promise<BorradorVisita | null> {
  try {
    const texto = await Storage.getItemAsync(CLAVE);
    if (!texto) return null;
    const { guardadoEn, ...borrador } = JSON.parse(texto) as BorradorVisita & { guardadoEn: number };
    if (Date.now() - guardadoEn > VIGENCIA_MS) {
      await borrarBorrador();
      return null;
    }
    return borrador;
  } catch {
    return null; // un borrador roto no puede impedir que la app arranque
  }
}

export async function borrarBorrador(): Promise<void> {
  await Storage.removeItemAsync(CLAVE).catch(() => undefined);
}
