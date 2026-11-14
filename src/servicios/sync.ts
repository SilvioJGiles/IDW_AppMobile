import * as Network from 'expo-network';
import { visitasPendientes, marcarSincronizada } from './db';

export async function sincronizar() {
  const estado = await Network.getNetworkStateAsync();
  if (!estado.isConnected || !estado.isInternetReachable) return;

  const pendientes: any[] = await visitasPendientes();
  for (const v of pendientes) {
    try {
      // const res = await fetch(`${API_URL}/visitas`, { method: 'POST', ... });
      // if (res.ok) await marcarSincronizada(v.id);
      await marcarSincronizada(v.id); // mock mientras no haya API
    } catch {
      break; // reintenta en la próxima pasada
    }
  }
}