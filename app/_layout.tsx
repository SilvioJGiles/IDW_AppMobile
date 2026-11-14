import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { clienteConsultas, conectarEventosDelTelefono } from '../src/consultas/cliente';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // TanStack Query: refrescar al volver a la app y pausar sin señal
  useEffect(() => conectarEventosDelTelefono(), []);

  return (
    <QueryClientProvider client={clienteConsultas}>
      <Stack>
        {/* Sin encabezado propio: si no, se ven dos, uno arriba del otro */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lugar/[id]" options={{ title: 'Lugar', headerBackTitle: 'Volver' }} />
        <Stack.Screen name="escaner" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="visita/nueva" options={{ title: 'Registrar visita' }} />
      </Stack>

      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
