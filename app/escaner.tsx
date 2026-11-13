import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorRed } from '../src/servicios/cliente';
import { obtenerLugar } from '../src/servicios/lugares';
import { leerCodigoQr } from '../src/utils/qr';

type Estado = 'escaneando' | 'verificando' | 'error';

class QrNoReconocido extends Error {}

function mensajeDe(e: unknown): string {
  if (e instanceof QrNoReconocido) return 'Ese código no es de Mi Ciudad. Probá con el cartel de otro lugar.';
  if (e instanceof ErrorRed) return 'No hay señal y no tenemos guardado ese lugar. Probá de nuevo con conexión.';
  return 'No pudimos leer el código. Probá de nuevo.';
}

/**
 * Se abre como modal. Ciclo de vida de la cámara:
 *  - la CameraView sólo existe mientras la pantalla tiene foco Y la app está en primer plano;
 *  - un `useRef` actúa de cerrojo: la cámara dispara onBarcodeScanned muchas veces por segundo
 *    y sin cerrojo registraríamos/navegaríamos varias veces con el mismo QR.
 */
export default function Escaner() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [camaraActiva, setCamaraActiva] = useState(true);
  const [estado, setEstado] = useState<Estado>('escaneando');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const cerrojo = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Foco de pantalla: al salir (o abrir otra pantalla encima) se libera la cámara.
  useFocusEffect(
    useCallback(() => {
      setCamaraActiva(true);
      return () => setCamaraActiva(false);
    }, []),
  );

  // App en segundo plano: se apaga la cámara; al volver se prende.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setCamaraActiva(s === 'active'));
    return () => {
      sub.remove();
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const alEscanear = async ({ data }: { data: string }) => {
    if (cerrojo.current) return;
    cerrojo.current = true;
    setEstado('verificando');
    try {
      const lugarId = leerCodigoQr(data);
      if (!lugarId) throw new QrNoReconocido();
      const lugar = await obtenerLugar(lugarId);
      if (!lugar) throw new QrNoReconocido();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/visita/nueva', params: { lugarId: lugar.id, origen: 'qr' } });
    } catch (e) {
      setMensaje(mensajeDe(e));
      setEstado('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      // Se libera el cerrojo a los 2,5 s: el turista puede apuntar a otro cartel sin cerrar nada.
      temporizador.current = setTimeout(() => {
        cerrojo.current = false;
        setMensaje(null);
        setEstado('escaneando');
      }, 2500);
    }
  };

  if (!permiso) return <View style={estilos.centro} />; // todavía consultando el permiso

  if (!permiso.granted) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>Necesitamos la cámara para leer el QR</Text>
        <Text style={estilos.texto}>Si preferís, podés registrar la visita a mano, sin cámara.</Text>
        {permiso.canAskAgain ? (
          <Boton texto="Permitir la cámara" onPress={pedirPermiso} />
        ) : (
          <Boton texto="Abrir ajustes" onPress={() => Linking.openSettings()} />
        )}
        <Boton
          texto="Registrar a mano"
          secundario
          onPress={() => router.replace({ pathname: '/visita/nueva', params: { origen: 'manual' } })}
        />
        <Boton texto="Cerrar" secundario onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      {camaraActiva && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={estado === 'escaneando' ? alEscanear : undefined}
        />
      )}
      <View style={estilos.marco} pointerEvents="none" />
      <View style={estilos.barra}>
        {estado === 'verificando' && <ActivityIndicator size="large" color="#fff" />}
        <Text accessibilityLiveRegion="polite" style={[estilos.aviso, estado === 'error' && estilos.avisoError]}>
          {estado === 'error' && mensaje
            ? mensaje
            : estado === 'verificando'
              ? 'Verificando…'
              : 'Apuntá al código QR del cartel'}
        </Text>
        <Boton texto="Cerrar" secundario claro onPress={() => router.back()} />
      </View>
    </View>
  );
}

function Boton(props: { texto: string; onPress: () => void; secundario?: boolean; claro?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [
        estilos.boton,
        props.secundario && estilos.botonSec,
        props.claro && { borderColor: '#fff' },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[estilos.botonTexto, props.secundario && estilos.botonTextoSec, props.claro && { color: '#fff' }]}>{props.texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#000' },
  centro: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#111' },
  texto: { fontSize: 18, color: '#333' },
  marco: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 24,
  },
  barra: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, gap: 14, backgroundColor: 'rgba(0,0,0,0.75)' },
  aviso: { fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center' },
  avisoError: { color: '#ffd1d1' },
  boton: { minHeight: 56, borderRadius: 14, backgroundColor: '#0a6c5b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  botonSec: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#0a6c5b' },
  botonTexto: { fontSize: 20, fontWeight: '700', color: '#fff' },
  botonTextoSec: { color: '#0a6c5b' },
});
