import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('miciudad.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visitas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lugar_id TEXT NOT NULL,
        origen TEXT NOT NULL,          -- 'qr' | 'gps' | 'manual'
        nota TEXT,
        foto_uri TEXT,
        fecha TEXT NOT NULL,
        sincronizada INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS favoritos (
        lugar_id TEXT PRIMARY KEY NOT NULL,
        fecha TEXT NOT NULL
      );
    `);
  }
  return db;
}

export async function guardarVisitaLocal(v: { lugar_id: string; origen: string; nota?: string; foto_uri?: string }) {
  const d = await getDB();
  await d.runAsync(
    'INSERT INTO visitas (lugar_id, origen, nota, foto_uri, fecha, sincronizada) VALUES (?,?,?,?,?,0)',
    v.lugar_id, v.origen, v.nota ?? null, v.foto_uri ?? null, new Date().toISOString()
  );
}

export async function visitasPendientes() {
  const d = await getDB();
  return d.getAllAsync('SELECT * FROM visitas WHERE sincronizada = 0');
}

export async function marcarSincronizada(id: number) {
  const d = await getDB();
  await d.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', id);
}