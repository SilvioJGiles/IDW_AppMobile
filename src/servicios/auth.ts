import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export const guardarToken = (t: string) => SecureStore.setItemAsync('token', t);
export const leerToken = () => SecureStore.getItemAsync('token');
export const borrarToken = () => SecureStore.deleteItemAsync('token');

export async function loginBiometrico() {
  const hay = await LocalAuthentication.hasHardwareAsync();
  const registrada = await LocalAuthentication.isEnrolledAsync();
  if (!hay || !registrada) return false;
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Ingresá con tu huella' });
  return r.success;
}