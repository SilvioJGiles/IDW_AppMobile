import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNetworkState } from 'expo-network';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Lugar, OrigenVisita } from '../../src/tipos';
import { listarLugares } from '../../src/servicios/lugares';
import { ingresarDemoSiHaceFalta } from '../../src/servicios/sesionDemo';
import { descargarRecorrido, sincronizar } from '../../src/servicios/visitas';
import { listarLocales, type VisitaLocal } from '../../src/servicios/visitasLocal';
import { formatearFechaHora } from '../../src/utils/fechas';

const ORIGEN: Record<OrigenVisita, { icono: 'qr-code' | 'location' | 'create'; texto: string }> = {
  qr: { icono: 'qr-code', texto: 'Código QR' },
  gps: { icono: 'location', texto: 'Cerca del lugar' },
  manual: { icono: 'create', texto: 'Cargada a mano' },
};

export default function MiRecorrido() {
  const [visitas, setVisitas] = useState<VisitaLocal[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [refrescando, setRefrescando] = useState(false);
  const [cargado, setCargado] = useState(false);
  const red = useNetworkState();
  const hayRed = !!red.isConnected && red.isInternetReachable !== false;

  const recargar = useCallback(async () => {
    setVisitas(await listarLocales());
    setCargado(true);
  }, []);

  // Nombres de los lugares (desde la caché: anda sin señal).
  useEffect(() => {
    listarLugares()
      .then((ls: Lugar[]) => setNombres(Object.fromEntries(ls.map((l) => [l.id, l.nombre]))))
      .catch(() => undefined);
  }, []);

  // Cada vez que la pestaña toma foco: mostrar lo local al instante.
  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  // Cuando vuelve la señal: subir la cola y, si cambió de teléfono, bajar lo guardado en la cuenta.
  useEffect(() => {
    if (!hayRed) return;
    (async () => {
      try {
        await ingresarDemoSiHaceFalta(); // quitar cuando exista el login real
        await sincronizar();
        await descargarRecorrido();
      } catch {
        /* sin sesión o servidor dormido: queda para el próximo intento */
      }
      await recargar();
    })();
  }, [hayRed, recargar]);

  const alRefrescar = async () => {
    setRefrescando(true);
    try {
      await ingresarDemoSiHaceFalta(); // quitar cuando exista el login real
      await sincronizar();
      await descargarRecorrido();
    } catch {
      /* se muestra lo local */
    }
    await recargar();
    setRefrescando(false);
  };

  const pendientes = visitas.filter((v) => !v.sincronizada).length;

  return (
    <View style={s.pantalla}>
      {pendientes > 0 && (
        <Text style={s.banner} accessibilityLiveRegion="polite">
          {pendientes === 1 ? '1 visita todavía sin subir' : `${pendientes} visitas todavía sin subir`}
          {hayRed ? ' · subiendo…' : ' · se suben cuando haya señal'}
        </Text>
      )}
      <FlatList
        data={visitas}
        keyExtractor={(v) => v.id}
        contentContainerStyle={s.lista}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alRefrescar} />}
        ListEmptyComponent={
          cargado ? (
            <View style={s.vacio}>
              <Text style={s.vacioTitulo}>Todavía no registraste visitas</Text>
              <Text style={s.vacioTexto}>Escaneá el QR de un cartel o registrá donde estás, y tu recorrido aparece acá.</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => <Tarjeta visita={item} nombre={nombres[item.lugarId] ?? 'Lugar de Colón'} />}
      />
      <View style={s.pie}>
        <Pressable accessibilityRole="button" style={s.fab} onPress={() => router.push('/visita/nueva')}>
          <Ionicons name="add-circle" size={26} color="#fff" />
          <Text style={s.fabTexto}>Registrar visita</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear código QR"
          style={s.fabQr}
          onPress={() => router.push('/escaner')}
        >
          <Ionicons name="qr-code" size={28} color="#0a6c5b" />
        </Pressable>
      </View>
    </View>
  );
}

function Tarjeta({ visita, nombre }: { visita: VisitaLocal; nombre: string }) {
  const o = ORIGEN[visita.origen];
  return (
    <View style={s.tarjeta}>
      <Text style={s.nombre}>{nombre}</Text>
      <Text style={s.fecha}>{formatearFechaHora(visita.fechaHora)}</Text>
      <View style={s.fila}>
        <Ionicons name={o.icono} size={20} color="#0a6c5b" />
        <Text style={s.origen}>{o.texto}</Text>
      </View>
      {visita.fotoUri && <Image source={{ uri: visita.fotoUri }} style={s.foto} accessibilityLabel={`Foto en ${nombre}`} />}
      {visita.nota && <Text style={s.nota}>“{visita.nota}”</Text>}
      <View style={s.fila}>
        <Ionicons
          name={visita.errorSync ? 'alert-circle' : visita.sincronizada ? 'cloud-done' : 'cloud-offline'}
          size={20}
          color={visita.errorSync ? '#b00020' : visita.sincronizada ? '#0a6c5b' : '#8a5a00'}
        />
        <Text style={[s.estado, visita.errorSync && { color: '#b00020' }]}>
          {visita.errorSync ?? (visita.sincronizada ? 'Guardada en tu cuenta' : 'Pendiente de subir')}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#f6f6f2' },
  banner: { backgroundColor: '#fff3cd', color: '#5c4400', fontSize: 17, fontWeight: '600', padding: 12, textAlign: 'center' },
  lista: { padding: 16, gap: 14, paddingBottom: 120, flexGrow: 1 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#ddd' },
  nombre: { fontSize: 22, fontWeight: '800', color: '#111' },
  fecha: { fontSize: 17, color: '#444' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  origen: { fontSize: 17, color: '#0a6c5b', fontWeight: '600' },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#ddd' },
  nota: { fontSize: 19, fontStyle: 'italic', color: '#222' },
  estado: { fontSize: 16, color: '#444', flexShrink: 1 },
  vacio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  vacioTitulo: { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center' },
  vacioTexto: { fontSize: 19, color: '#333', textAlign: 'center' },
  pie: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', gap: 12 },
  fab: { flex: 1, minHeight: 60, borderRadius: 16, backgroundColor: '#0a6c5b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fabTexto: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fabQr: { width: 60, minHeight: 60, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#0a6c5b', alignItems: 'center', justifyContent: 'center' },
});
