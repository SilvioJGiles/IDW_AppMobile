import { Directory, File, Paths } from 'expo-file-system';
import { API_URL } from './config';

const carpeta = new Directory(Paths.document, 'audioguias');

function archivoDe(lugarId: string): File {
  return new File(carpeta, `${lugarId}.mp3`);
}

function urlCompleta(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Uri local si la audioguía ya está descargada; null si no. */
export function uriAudioLocal(lugarId: string): string | null {
  const f = archivoDe(lugarId);
  return f.exists ? f.uri : null;
}

/** Descarga al almacenamiento del teléfono (Paths.document) para escucharla sin señal. */
export async function descargarAudio(lugarId: string, url: string): Promise<string> {
  if (!carpeta.exists) carpeta.create({ intermediates: true });
  const destino = archivoDe(lugarId);
  if (destino.exists) return destino.uri;
  try {
    const descargado = await File.downloadFileAsync(urlCompleta(url), destino);
    return descargado.uri;
  } catch (e) {
    if (destino.exists) destino.delete(); // no dejar un archivo a medias
    throw e;
  }
}

export function borrarAudio(lugarId: string): void {
  const f = archivoDe(lugarId);
  if (f.exists) f.delete();
}