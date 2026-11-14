import * as SQLite from 'expo-sqlite';
import type { OrigenVisita, Visita } from '../tipos';

/**
 * Mi recorrido vive primero en el teléfono (SQLite) y después se sube.
 * `Visita.sincronizada` = enServidor && !sucia.
 *  - enServidor: la API ya tiene esta visita (POST hecho).
 *  - sucia: se cambió la foto o la nota después y falta el PATCH.
 */
export interface VisitaLocal extends Visita {
  enServidor: boolean;
  sucia: boolean;
  fotoLocal: string | null;
  fotoRemota: string | null;
  errorSync: string | null;
}

interface Fila {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  ts: number;
  origen: OrigenVisita;
  fotoLocal: string | null;
  fotoRemota: string | null;
  nota: string | null;
  enServidor: number;
  sucia: number;
  errorSync: string | null;
}

let dbPromesa: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromesa ??= (async () => {
    const d = await SQLite.openDatabaseAsync('recorrido.db');
    await d.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS visitas (
        id          TEXT PRIMARY KEY NOT NULL,
        usuarioId   TEXT NOT NULL,
        lugarId     TEXT NOT NULL,
        fechaHora   TEXT NOT NULL,
        ts          INTEGER NOT NULL,
        origen      TEXT NOT NULL,
        fotoLocal   TEXT,
        fotoRemota  TEXT,
        nota        TEXT,
        enServidor  INTEGER NOT NULL DEFAULT 0,
        sucia       INTEGER NOT NULL DEFAULT 0,
        errorSync   TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_visitas_ts ON visitas (ts, id);
    `);
    return d;
  })();
  return dbPromesa;
}

function aVisita(f: Fila): VisitaLocal {
  const enServidor = f.enServidor === 1;
  const sucia = f.sucia === 1;
  return {
    id: f.id,
    usuarioId: f.usuarioId,
    lugarId: f.lugarId,
    fechaHora: f.fechaHora,
    origen: f.origen,
    fotoUri: f.fotoLocal ?? f.fotoRemota, // se muestra la local aunque ya esté subida (sirve sin señal)
    nota: f.nota,
    sincronizada: enServidor && !sucia,
    enServidor,
    sucia,
    fotoLocal: f.fotoLocal,
    fotoRemota: f.fotoRemota,
    errorSync: f.errorSync,
  };
}

/** En orden cronológico (la más vieja primero), igual que la API. */
export async function listarLocales(): Promise<VisitaLocal[]> {
  const d = await db();
  const filas = await d.getAllAsync<Fila>('SELECT * FROM visitas ORDER BY ts ASC, id ASC');
  return filas.map(aVisita);
}

export async function obtenerLocal(id: string): Promise<VisitaLocal | null> {
  const d = await db();
  const f = await d.getFirstAsync<Fila>('SELECT * FROM visitas WHERE id = ?', [id]);
  return f ? aVisita(f) : null;
}

/** Visitas que faltan subir (nunca enviadas o con cambios), sin error permanente. */
export async function pendientes(): Promise<VisitaLocal[]> {
  const d = await db();
  const filas = await d.getAllAsync<Fila>(
    'SELECT * FROM visitas WHERE (enServidor = 0 OR sucia = 1) AND errorSync IS NULL ORDER BY ts ASC, id ASC',
  );
  return filas.map(aVisita);
}

export async function contarPendientes(): Promise<number> {
  const d = await db();
  const r = await d.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM visitas WHERE (enServidor = 0 OR sucia = 1)',
  );
  return r?.n ?? 0;
}

export async function insertarLocal(v: {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoLocal: string | null;
  nota: string | null;
}): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO visitas (id, usuarioId, lugarId, fechaHora, ts, origen, fotoLocal, nota, enServidor, sucia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [v.id, v.usuarioId, v.lugarId, v.fechaHora, new Date(v.fechaHora).getTime(), v.origen, v.fotoLocal, v.nota],
  );
}

export async function marcarSubida(id: string): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE visitas SET enServidor = 1, sucia = 0, errorSync = NULL WHERE id = ?', [id]);
}

export async function guardarFotoRemota(id: string, url: string): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE visitas SET fotoRemota = ? WHERE id = ?', [url, id]);
}

export async function guardarErrorSync(id: string, mensaje: string): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE visitas SET errorSync = ? WHERE id = ?', [mensaje, id]);
}

/** Cambios posteriores (foto o nota). Quedan "sucios" hasta el próximo PATCH. */
export async function actualizarLocal(
  id: string,
  cambios: { fotoLocal?: string | null; nota?: string | null },
): Promise<void> {
  const d = await db();
  if (cambios.fotoLocal !== undefined) {
    await d.runAsync('UPDATE visitas SET fotoLocal = ?, fotoRemota = NULL, sucia = 1 WHERE id = ?', [
      cambios.fotoLocal,
      id,
    ]);
  }
  if (cambios.nota !== undefined) {
    await d.runAsync('UPDATE visitas SET nota = ?, sucia = 1 WHERE id = ?', [cambios.nota, id]);
  }
}

/** Visitas que vienen del servidor (cambio de teléfono). Nunca pisa lo que ya hay acá. */
export async function mezclarDelServidor(visitas: Visita[]): Promise<number> {
  const d = await db();
  let nuevas = 0;
  await d.withTransactionAsync(async () => {
    for (const v of visitas) {
      const r = await d.runAsync(
        `INSERT OR IGNORE INTO visitas
           (id, usuarioId, lugarId, fechaHora, ts, origen, fotoLocal, fotoRemota, nota, enServidor, sucia)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 1, 0)`,
        [v.id, v.usuarioId, v.lugarId, v.fechaHora, new Date(v.fechaHora).getTime(), v.origen, v.fotoUri, v.nota],
      );
      nuevas += r.changes;
    }
  });
  return nuevas;
}
