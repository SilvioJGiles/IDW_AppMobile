import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Lugar, OrigenVisita } from '../../src/tipos';
import { ErrorRed } from '../../src/servicios/cliente';
import { listarLugares, obtenerLugar } from '../../src/servicios/lugaresAdaptador';
import { obtenerPosicion } from '../../src/servicios/ubicacion';
import { ErrorValidacion, LARGO_MAXIMO_NOTA, registrarVisita } from '../../src/servicios/visitas';
import { lugarMasCercano } from '../../src/utils/distancia';

const RADIO_PROXIMIDAD_M = 150;

/**
 * Estados del formulario (máquina de estados):
 *   cargando ──► eligiendo (sin lugar) ──► editando ──► guardando ──► (navega)
 *                                             ▲              │ falla
 *                                             └── error ◄────┘
 * `guardando` bloquea el botón: evita registrar dos veces con un doble toque.
 */
type Estado = 'cargando' | 'eligiendo' | 'editando' | 'guardando' | 'error';

export default function NuevaVisita() {
  const params = useLocalSearchParams<{ lugarId?: string; origen?: OrigenVisita }>();
  const [estado, setEstado] = useState<Estado>(params.lugarId ? 'cargando' : 'eligiendo');
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [origen, setOrigen] = useState<OrigenVisita>(params.origen ?? 'manual');
  const [foto, setFoto] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Si llegó con un lugar (QR o botón "Registrar visita" del detalle), se carga.
  useEffect(() => {
    if (!params.lugarId) return;
    let vivo = true;
    obtenerLugar(params.lugarId)
      .then((l) => {
        if (!vivo) return;
        if (l) {
          setLugar(l);
          setEstado('editando');
        } else {
          setError('No encontramos ese lugar.');
          setEstado('eligiendo');
        }
      })
      .catch((e) => {
        if (!vivo) return;
        setError(e instanceof ErrorRed ? 'Sin señal: no pudimos cargar el lugar.' : 'No pudimos cargar el lugar.');
        setEstado('eligiendo');
      });
    return () => {
      vivo = false;
    };
  }, [params.lugarId]);

  const elegir = useCallback((l: Lugar, o: OrigenVisita) => {
    setLugar(l);
    setOrigen(o);
    setError(null);
    setEstado('editando');
  }, []);

  const avisarPermiso = (que: string) =>
    Alert.alert(`Falta el permiso de ${que}`, 'Podés habilitarlo en los ajustes del teléfono. Mientras tanto, la visita se puede guardar sin foto.', [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
    ]);

  const sacarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return avisarPermiso('la cámara');
    try {
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!r.canceled) setFoto(r.assets[0].uri);
    } catch {
      setError('No pudimos abrir la cámara.');
    }
  };

  const elegirDeGaleria = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!r.canceled) setFoto(r.assets[0].uri);
    } catch {
      setError('No pudimos abrir la galería.');
    }
  };

  const guardar = async () => {
    if (!lugar || estado === 'guardando') return;
    setEstado('guardando');
    setError(null);
    try {
      await registrarVisita({ lugarId: lugar.id, origen, fotoTemporal: foto, nota });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/recorrido');
    } catch (e) {
      setError(e instanceof ErrorValidacion ? e.message : 'No pudimos guardar la visita. Probá de nuevo.');
      setEstado('error');
    }
  };

  if (estado === 'cargando') {
    return (
      <View style={e.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (estado === 'eligiendo' || !lugar) {
    return <ElegirLugar error={error} onElegir={elegir} />;
  }

  const guardando = estado === 'guardando';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={e.contenido} keyboardShouldPersistTaps="handled">
        <Text style={e.etiqueta}>Registrar visita en</Text>
        <Text style={e.lugar} accessibilityRole="header">
          {lugar.nombre}
        </Text>
        <Text style={e.chip}>{origen === 'qr' ? 'Por código QR' : origen === 'gps' ? 'Por cercanía (GPS)' : 'Cargada a mano'}</Text>

        {foto ? (
          <View style={{ gap: 10 }}>
            <Image source={{ uri: foto }} style={e.foto} accessibilityLabel="Foto de la visita" />
            <Boton texto="Quitar foto" secundario onPress={() => setFoto(null)} deshabilitado={guardando} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Boton texto="📷  Sacar una foto" onPress={sacarFoto} deshabilitado={guardando} />
            <Boton texto="🖼️  Elegir de la galería" secundario onPress={elegirDeGaleria} deshabilitado={guardando} />
          </View>
        )}

        <Text style={e.etiqueta}>Nota (opcional)</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          editable={!guardando}
          placeholder="Ej.: Hacía 38 grados pero valió la pena"
          placeholderTextColor="#6b6b6b"
          multiline
          maxLength={LARGO_MAXIMO_NOTA}
          style={e.input}
          accessibilityLabel="Nota de la visita"
        />
        <Text style={e.contador}>
          {nota.length}/{LARGO_MAXIMO_NOTA}
        </Text>

        {error && (
          <Text style={e.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        <Boton
          texto={guardando ? 'Guardando…' : 'Guardar visita'}
          onPress={guardar}
          deshabilitado={guardando}
          cargando={guardando}
        />
        <Boton texto="Cancelar" secundario onPress={() => router.back()} deshabilitado={guardando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Sin lugar de entrada: QR, "Estoy acá" (GPS) o elegir de la lista (manual). */
function ElegirLugar(props: { error: string | null; onElegir: (l: Lugar, o: OrigenVisita) => void }) {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [aviso, setAviso] = useState<string | null>(props.error);

  useEffect(() => {
    listarLugares()
      .then(setLugares)
      .catch(() => setAviso('No pudimos cargar la lista de lugares. Probá con el QR o con señal.'))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? lugares.filter((l) => l.nombre.toLowerCase().includes(q)) : lugares;
  }, [busqueda, lugares]);

  const estoyAca = async () => {
    setBuscandoGps(true);
    setAviso(null);
    const pos = await obtenerPosicion();
    setBuscandoGps(false);
    if (!pos.ok) {
      setAviso(
        pos.motivo === 'denegado'
          ? 'No tenemos permiso de ubicación. Elegí el lugar de la lista o escaneá el QR.'
          : 'No pudimos obtener tu ubicación. Elegí el lugar de la lista o escaneá el QR.',
      );
      return;
    }
    const cerca = lugarMasCercano(pos.coordenadas, lugares, RADIO_PROXIMIDAD_M);
    if (!cerca) {
      setAviso(`No hay lugares a menos de ${RADIO_PROXIMIDAD_M} m. Elegí uno de la lista.`);
      return;
    }
    props.onElegir(cerca.lugar, 'gps');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={e.contenido}>
        <Text style={e.lugar} accessibilityRole="header">
          ¿Dónde estás?
        </Text>
        <Boton texto="📷  Escanear el QR del cartel" onPress={() => router.replace('/escaner')} />
        <Boton
          texto={buscandoGps ? 'Buscando…' : '📍  Estoy acá (usar mi ubicación)'}
          secundario
          onPress={estoyAca}
          deshabilitado={buscandoGps || cargando}
          cargando={buscandoGps}
        />
        {aviso && (
          <Text style={e.error} accessibilityLiveRegion="polite">
            {aviso}
          </Text>
        )}
        <Text style={e.etiqueta}>O elegí de la lista</Text>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar lugar"
          placeholderTextColor="#6b6b6b"
          style={[e.input, { minHeight: 52 }]}
          accessibilityLabel="Buscar lugar"
        />
      </View>
      {cargando ? (
        <ActivityIndicator size="large" style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={e.texto}>No hay lugares para mostrar.</Text>}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" style={e.fila} onPress={() => props.onElegir(item, 'manual')}>
              <Text style={e.filaTexto}>{item.nombre}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Boton(props: {
  texto: string;
  onPress: () => void;
  secundario?: boolean;
  deshabilitado?: boolean;
  cargando?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.deshabilitado }}
      disabled={props.deshabilitado}
      onPress={props.onPress}
      style={({ pressed }) => [
        e.boton,
        props.secundario && e.botonSec,
        (pressed || props.deshabilitado) && { opacity: 0.6 },
      ]}
    >
      {props.cargando ? (
        <ActivityIndicator color={props.secundario ? '#0a6c5b' : '#fff'} />
      ) : (
        <Text style={[e.botonTexto, props.secundario && e.botonTextoSec]}>{props.texto}</Text>
      )}
    </Pressable>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contenido: { padding: 20, gap: 14 },
  etiqueta: { fontSize: 18, fontWeight: '600', color: '#333' },
  lugar: { fontSize: 28, fontWeight: '800', color: '#111' },
  chip: { alignSelf: 'flex-start', fontSize: 16, color: '#0a6c5b', fontWeight: '700' },
  texto: { fontSize: 18, color: '#333', textAlign: 'center', marginTop: 16 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: '#ddd' },
  input: {
    minHeight: 110,
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 14,
    padding: 14,
    fontSize: 20,
    color: '#111',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  contador: { alignSelf: 'flex-end', fontSize: 16, color: '#555' },
  error: { fontSize: 18, color: '#b00020', fontWeight: '600' },
  fila: { minHeight: 56, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10 },
  filaTexto: { fontSize: 20, color: '#111' },
  boton: { minHeight: 56, borderRadius: 14, backgroundColor: '#0a6c5b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  botonSec: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#0a6c5b' },
  botonTexto: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  botonTextoSec: { color: '#0a6c5b' },
});
