// TanStack Query: el dato del servidor es una copia que envejece, no estado de la app.
// Un solo QueryClient para toda la app (se monta en app/_layout.tsx).

import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState, AppStateStatus, Platform } from "react-native";

import { ErrorApi } from "../servicios/cliente";

// No tiene sentido reintentar un 4xx (no existe, faltan datos, sin permiso): va a dar lo mismo.
// Sí se reintenta si no hubo respuesta (ErrorRed) o el servidor falló (5xx).
export function debeReintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorApi && error.estado < 500) {
    return false;
  }

  return intentos < 2;
}

export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // el catálogo cambia poco: 5 minutos sin volver a pedirlo
      gcTime: 30 * 60 * 1000, // se guarda en memoria 30 minutos sin uso
      retry: debeReintentar,
    },
    mutations: {
      retry: false,
    },
  },
});

// En React Native no hay "foco de ventana": se conecta AppState para que,
// al volver a la app, se refresquen los datos viejos.
function alCambiarEstado(estado: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(estado === "active");
  }
}

// Sin conexión, TanStack Query pausa los pedidos y los retoma cuando vuelve la señal.
export function conectarEventosDelTelefono(): () => void {
  const suscripcionApp = AppState.addEventListener("change", alCambiarEstado);

  onlineManager.setEventListener((setOnline) => {
    const suscripcionRed = Network.addNetworkStateListener((estado) => {
      setOnline(estado.isConnected ?? true);
    });

    return () => suscripcionRed.remove();
  });

  return () => suscripcionApp.remove();
}
