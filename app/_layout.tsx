import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AvisoSinConexion } from '../components/AvisoSinConexion';
import { Bienvenida } from '../components/Bienvenida';
import { useSincronizarAlVolverRed } from '../src/hooks/useSincronizarAlVolverRed';

import { clienteConsultas, conectarEventosDelTelefono } from '../src/consultas/cliente';

// Se llama apenas se carga este archivo, antes de dibujar nada: el splash nativo
// queda visible hasta que la bienvenida lo oculte (ver components/Bienvenida.tsx).
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // TanStack Query: refrescar al volver a la app y pausar sin señal
  useEffect(() => conectarEventosDelTelefono(), []);
  useSincronizarAlVolverRed();
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  return (
    <QueryClientProvider client={clienteConsultas}>
      <Stack>
        {/* Sin encabezado propio: si no, se ven dos, uno arriba del otro */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lugar/[id]" options={{ title: 'Lugar', headerBackTitle: 'Volver' }} />
        <Stack.Screen name="escaner" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="visita/nueva" options={{ title: 'Registrar visita' }} />
      </Stack>

      {/* Después del Stack: así se dibuja encima de cualquier pantalla */}
      <AvisoSinConexion />

      {/* Va al final para quedar encima de todo; la app se carga por debajo mientras tanto */}
      {mostrarBienvenida && <Bienvenida alTerminar={() => setMostrarBienvenida(false)} />}

      {/* Barra de estado clara sobre la imagen oscura, oscura sobre el resto de la app */}
      <StatusBar style={mostrarBienvenida ? 'light' : 'dark'} />
    </QueryClientProvider>
  );
}
