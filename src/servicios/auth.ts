import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { obtenerSesion, type Sesion } from './sesion';

const CLAVE_BIOMETRIA = 'mc_biometria_activa';

export async function biometriaDisponible(): Promise<boolean> {
  const hayHardware = await LocalAuthentication.hasHardwareAsync();
  const registrada = await LocalAuthentication.isEnrolledAsync();
  return hayHardware && registrada;
}

export async function biometriaActivada(): Promise<boolean> {
  return (await SecureStore.getItemAsync(CLAVE_BIOMETRIA)) === '1';
}

/** El usuario la activa una vez, después de haber ingresado con email y contraseña. */
export async function activarBiometria(): Promise<boolean> {
  if (!(await biometriaDisponible())) return false;
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirmá tu huella o rostro para activar el ingreso rápido',
  });
  if (!r.success) return false;
  await SecureStore.setItemAsync(CLAVE_BIOMETRIA, '1');
  return true;
}

export async function desactivarBiometria(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_BIOMETRIA);
}

/** Devuelve la sesión guardada si la huella/rostro es válida; null si hay que ingresar con contraseña. */
export async function ingresarConBiometria(): Promise<Sesion | null> {
  if (!(await biometriaActivada())) return null;
  const sesion = await obtenerSesion();
  if (!sesion) return null; // no hay token guardado: ingreso normal
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Ingresá con tu huella o rostro',
    cancelLabel: 'Usar contraseña',
  });
  return r.success ? sesion : null;
}