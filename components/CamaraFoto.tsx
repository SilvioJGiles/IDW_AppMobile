import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Cámara DENTRO de la app para la foto de la visita.
//
// Antes usábamos ImagePicker.launchCameraAsync, que abre la app de Cámara de Android.
// Mientras esa otra app está abierta, Android puede cerrar la nuestra para liberar
// memoria: al confirmar la foto, Mi Ciudad se reiniciaba y la foto se perdía.
// Con expo-camera la cámara es parte de nuestra pantalla: nunca salimos de la app,
// así que Android no tiene motivo para cerrarla.

interface Props {
  visible: boolean;
  alElegir: (uri: string) => void;
  alCancelar: () => void;
}

export function CamaraFoto({ visible, alElegir, alCancelar }: Props) {
  const camara = useRef<CameraView>(null);
  const { top, bottom } = useSafeAreaInsets();
  const [lista, setLista] = useState(false); // takePictureAsync solo después de onCameraReady
  const [sacando, setSacando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const cerrar = () => {
    setVistaPrevia(null);
    setLista(false);
    alCancelar();
  };

  const disparar = async () => {
    if (!camara.current || !lista || sacando) return; // evita dos fotos con un doble toque
    setSacando(true);
    try {
      const foto = await camara.current.takePictureAsync({ quality: 0.6 });
      // Vibración corta: confirma que la foto se sacó aunque no se oiga el obturador
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setVistaPrevia(foto.uri);
    } catch {
      // si falla, se queda en la cámara y se puede volver a intentar
    } finally {
      setSacando(false);
    }
  };

  const usarFoto = () => {
    if (!vistaPrevia) return;
    const uri = vistaPrevia;
    setVistaPrevia(null);
    setLista(false);
    alElegir(uri);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar} statusBarTranslucent>
      <View style={estilos.fondo}>
        {vistaPrevia ? (
          // Paso 2: igual que la cámara del teléfono, se confirma antes de usarla
          <Image source={{ uri: vistaPrevia }} style={StyleSheet.absoluteFill} resizeMode="contain" accessibilityLabel="Foto sacada" />
        ) : (
          visible && (
            <CameraView
              ref={camara}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setLista(true)}
            />
          )
        )}

        <View style={[estilos.barraArriba, { paddingTop: top + 10 }]}>
          <Pressable onPress={cerrar} style={estilos.botonTexto} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Text style={estilos.texto}>Cancelar</Text>
          </Pressable>
        </View>

        <View style={[estilos.barraAbajo, { paddingBottom: bottom + 24 }]}>
          {vistaPrevia ? (
            <>
              <Pressable onPress={() => setVistaPrevia(null)} style={[estilos.botonAccion, estilos.botonSecundario]} accessibilityRole="button">
                <Text style={estilos.texto}>Repetir</Text>
              </Pressable>
              <Pressable onPress={usarFoto} style={estilos.botonAccion} accessibilityRole="button">
                <Text style={estilos.texto}>Usar foto</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={disparar}
              disabled={!lista || sacando}
              style={[estilos.disparador, (!lista || sacando) && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel="Sacar foto"
            >
              {sacando ? <ActivityIndicator color="#0a6c5b" /> : <View style={estilos.disparadorCentro} />}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#000' },
  barraArriba: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row' },
  barraAbajo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  botonTexto: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  texto: { color: '#fff', fontSize: 18, fontWeight: '700' },
  disparador: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disparadorCentro: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  botonAccion: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#0a6c5b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundario: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: '#fff' },
});
