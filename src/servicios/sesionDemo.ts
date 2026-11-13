import { API_URL } from './config';
import { guardarSesion, obtenerSesion } from './sesion';

// SOLO DESARROLLO (__DEV__): se borra cuando exista el login real.
// No hace nada en el APK de release ni si ya hay una sesión guardada.
// Usa el usuario de demo público de la API (lucia@mail.com).
export async function ingresarDemoSiHaceFalta(): Promise<void> {
  if (!__DEV__ || (await obtenerSesion())) return;
  try {
    const r = await fetch(`${API_URL}/auth/ingreso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lucia@mail.com', contrasena: 'lucia1234' }),
    });
    const j = await r.json();
    await guardarSesion(j.datos.token, j.datos.usuario.id);
  } catch {
    /* sin API no hay sesión de prueba */
  }
}
