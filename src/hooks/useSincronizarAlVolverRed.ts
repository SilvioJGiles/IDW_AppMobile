import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNetworkState } from 'expo-network';
import { sincronizar } from '../servicios/visitas';

/** Sube la cola de visitas cuando vuelve la conexión o cuando la app vuelve a primer plano. */
export function useSincronizarAlVolverRed() {
  const red = useNetworkState();
  const hayRed = red.isConnected === true && red.isInternetReachable !== false;

  useEffect(() => {
    if (hayRed) void sincronizar().catch(() => undefined);
  }, [hayRed]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void sincronizar().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);
}