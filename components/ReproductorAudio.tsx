import Ionicons from '@react-native-vector-icons/ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colores } from '../constants/colores';
import { descargarAudio, uriAudioLocal } from '../src/servicios/audio';
import type { Audioguia } from '../src/tipos';

function mmss(seg: number): string {
  const s = Math.max(0, Math.floor(seg || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function ReproductorAudio({
  lugarId,
  nombre,
  audioguia,
}: {
  lugarId: string;
  nombre: string;
  audioguia: Audioguia;
}) {
  const [uri, setUri] = useState<string | null>(() => uriAudioLocal(lugarId));
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = useAudioPlayer(uri);
  const estado = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true, // sigue sonando con la pantalla apagada
      interruptionMode: 'doNotMix',
    }).catch(() => undefined);
  }, []);

  // Al terminar, vuelve al principio
  useEffect(() => {
    if (estado.didJustFinish) void player.seekTo(0);
  }, [estado.didJustFinish, player]);

  async function descargar() {
    setError(null);
    setDescargando(true);
    try {
      setUri(await descargarAudio(lugarId, audioguia.url));
    } catch {
      setError('No se pudo descargar. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  function alternar() {
    if (estado.playing) {
      player.pause();
      return;
    }
    try {
      // En Android es lo que mantiene el audio vivo en segundo plano
      player.setActiveForLockScreen(true, { title: nombre, artist: 'Mi Ciudad · Audioguía' });
    } catch {
      /* Expo Go no lo soporta: no es grave */
    }
    player.play();
  }

  if (!uri) {
    return (
      <View style={estilos.caja}>
        <Pressable
          onPress={descargar}
          disabled={descargando}
          style={estilos.boton}
          accessibilityRole="button"
          accessibilityLabel="Descargar audioguía para escuchar sin señal"
        >
          {descargando ? (
            <ActivityIndicator color={Colores.primarioTexto} />
          ) : (
            <Ionicons name="cloud-download-outline" size={24} color={Colores.primarioTexto} />
          )}
          <Text style={estilos.botonTexto}>
            {descargando ? 'Descargando…' : `Descargar audioguía (${mmss(audioguia.duracionSegundos)})`}
          </Text>
        </Pressable>
        {error && <Text style={estilos.error}>{error}</Text>}
      </View>
    );
  }

  const total = estado.duration > 0 ? estado.duration : audioguia.duracionSegundos;
  const avance = total > 0 ? Math.min(1, estado.currentTime / total) : 0;

  return (
    <View style={estilos.caja}>
      <Pressable
        onPress={alternar}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={estado.playing ? 'Pausar audioguía' : 'Reproducir audioguía'}
      >
        <Ionicons name={estado.playing ? 'pause' : 'play'} size={26} color={Colores.primarioTexto} />
        <Text style={estilos.botonTexto}>{estado.playing ? 'Pausar' : 'Escuchar audioguía'}</Text>
      </Pressable>

      <View style={estilos.barraFondo}>
        <View style={[estilos.barra, { width: `${avance * 100}%` }]} />
      </View>
      <Text style={estilos.tiempo}>
        {mmss(estado.currentTime)} / {mmss(total)} · disponible sin señal
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: 8 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colores.primario,
  },
  botonTexto: { fontSize: 18, fontWeight: '700', color: Colores.primarioTexto, flexShrink: 1 },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: Colores.fondoSuave, overflow: 'hidden' },
  barra: { height: 8, backgroundColor: Colores.primario },
  tiempo: { fontSize: 15, color: Colores.textoSecundario },
  error: { fontSize: 16, color: Colores.error },
});