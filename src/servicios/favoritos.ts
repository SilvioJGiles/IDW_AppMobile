import { getDB } from './db';

export async function agregarFavorito(lugarId: string) {
  const d = await getDB();
  await d.runAsync(
    'INSERT OR IGNORE INTO favoritos (lugar_id, fecha) VALUES (?, ?)',
    lugarId, new Date().toISOString()
  );
}

export async function quitarFavorito(lugarId: string) {
  const d = await getDB();
  await d.runAsync('DELETE FROM favoritos WHERE lugar_id = ?', lugarId);
}

export async function esFavorito(lugarId: string) {
  const d = await getDB();
  const fila = await d.getFirstAsync('SELECT lugar_id FROM favoritos WHERE lugar_id = ?', lugarId);
  return fila !== null;
}

export async function listarFavoritos() {
  const d = await getDB();
  const filas = await d.getAllAsync<{ lugar_id: string }>('SELECT lugar_id FROM favoritos ORDER BY fecha DESC');
  return filas.map((f) => f.lugar_id);
}