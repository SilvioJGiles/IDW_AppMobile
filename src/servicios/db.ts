import * as SQLite from 'expo-sqlite';

let dbPromesa: Promise<SQLite.SQLiteDatabase> | null = null;

/** Base de datos propia de favoritos (la de visitas vive en visitasLocal.ts). */
export function getDB(): Promise<SQLite.SQLiteDatabase> {
  dbPromesa ??= (async () => {
    const d = await SQLite.openDatabaseAsync('favoritos.db');
    await d.execAsync(`
      CREATE TABLE IF NOT EXISTS favoritos (
        lugar_id TEXT PRIMARY KEY NOT NULL,
        fecha TEXT NOT NULL
      );
    `);
    return d;
  })();
  return dbPromesa;
}