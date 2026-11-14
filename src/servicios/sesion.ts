import * as SecureStore from 'expo-secure-store';

// ⚠️ ADAPTAR: si el integrante de cuenta/login guarda el token con otras claves,
// cambiá sólo estas dos constantes (o reemplazá este archivo por su servicio).
const CLAVE_TOKEN = 'mc_token';
const CLAVE_USUARIO = 'mc_usuario_id';

export interface Sesion {
  token: string;
  usuarioId: string;
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const [token, usuarioId] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN),
    SecureStore.getItemAsync(CLAVE_USUARIO),
  ]);
  return token && usuarioId ? { token, usuarioId } : null;
}

/** El login (módulo de cuenta) llama a esto después de POST /auth/ingreso o /auth/registro. */
export async function guardarSesion(token: string, usuarioId: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(CLAVE_TOKEN, token),
    SecureStore.setItemAsync(CLAVE_USUARIO, usuarioId),
  ]);
}

export async function cerrarSesion(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_TOKEN),
    SecureStore.deleteItemAsync(CLAVE_USUARIO),
  ]);
}
