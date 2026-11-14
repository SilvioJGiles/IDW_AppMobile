import Ionicons from '@react-native-vector-icons/ionicons';
import { useNetworkState } from 'expo-network';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colores } from '../constants/colores';

// Req. 7: avisar el estado de la red en toda la app, no solo en una pantalla.
// Va montado una sola vez en app/_layout.tsx, por encima de todas las pantallas.

type Estado = 'sin-red' | 'recuperada' | null;

const MS_AVISO_RECUPERADA = 3000;

export function AvisoSinConexion() {
  const red = useNetworkState();
  const { top } = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>(null);
  const estuvoSinRed = useRef(false);

  // Al abrir la app, useNetworkState todavía no sabe nada (los campos vienen undefined).
  // Por eso solo cuenta como "sin red" un false explícito: si usáramos
  // "!isConnected", el aviso aparecería un instante en cada apertura aunque haya señal.
  // isInternetReachable === false cubre el caso "conectado al wifi, pero sin internet".
  const sinRed = red.isConnected === false || red.isInternetReachable === false;
  const conRed = red.isConnected === true && red.isInternetReachable !== false;

  useEffect(() => {
    if (sinRed) {
      estuvoSinRed.current = true;
      setEstado('sin-red');
      return;
    }
    // "Recuperada" solo tiene sentido si antes estuvo cortada
    if (conRed && estuvoSinRed.current) {
      estuvoSinRed.current = false;
      setEstado('recuperada');
      const t = setTimeout(() => setEstado(null), MS_AVISO_RECUPERADA);
      return () => clearTimeout(t);
    }
  }, [sinRed, conRed]);

  if (!estado) return null;

  const recuperada = estado === 'recuperada';
  return (
    // pointerEvents="none": el aviso se ve, pero los toques pasan a la pantalla de abajo
    <View pointerEvents="none" style={[estilos.contenedor, { paddingTop: top + 6 }]}>
      <View
        style={[estilos.aviso, recuperada ? estilos.avisoOk : estilos.avisoSinRed]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={recuperada ? 'cloud-done-outline' : 'cloud-offline-outline'} size={20} color="#FFFFFF" />
        <Text style={estilos.texto}>
          {recuperada ? 'Conexión recuperada' : 'Sin conexión: mostrando lo guardado en el teléfono'}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 100 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 16,
  },
  avisoSinRed: { backgroundColor: Colores.texto },
  avisoOk: { backgroundColor: Colores.abierto },
  texto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flexShrink: 1 },
});
