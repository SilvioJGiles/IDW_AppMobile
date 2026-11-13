import { Directory, File, Paths } from 'expo-file-system';

// La cámara y la galería entregan un archivo en la CACHÉ (el sistema lo puede borrar).
// Lo copiamos a la carpeta de documentos de la app para que el recuerdo sobreviva y se vea sin señal.
// Ojo: expo-file-system nuevo = File / Directory / Paths (la API vieja tira error).

function carpetaVisitas(): Directory {
  const dir = new Directory(Paths.document, 'visitas');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Copia la foto elegida a documentos/visitas/<id>.jpg y devuelve su uri `file://`. */
export function guardarFotoLocal(visitaId: string, uriOrigen: string): string {
  const destino = new File(carpetaVisitas(), `${visitaId}.jpg`);
  if (destino.exists) destino.delete();
  new File(uriOrigen).copy(destino);
  return destino.uri;
}

export function existeFoto(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function borrarFotoLocal(uri: string | null): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* si no se puede borrar, no pasa nada */
  }
}
