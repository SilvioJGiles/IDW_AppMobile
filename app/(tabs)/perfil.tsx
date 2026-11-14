import Ionicons from '@react-native-vector-icons/ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotonFavorito } from '../../components/BotonFavorito';
import { Colores, TOQUE_MINIMO } from '../../constants/colores';
import {
  activarBiometria,
  biometriaActivada,
  biometriaDisponible,
  desactivarBiometria,
  ingresarConBiometria,
} from '../../src/servicios/auth';
import { listarFavoritos } from '../../src/servicios/favoritos';
import { obtenerLugar } from '../../src/servicios/lugares';
import { cerrarSesion, obtenerSesion, type Sesion } from '../../src/servicios/sesion'; import type { Lugar } from '../../src/tipos';
import { ingresarDemoSiHaceFalta } from '../../src/servicios/sesionDemo';

// Se recuerda mientras la app siga abierta: la huella se pide una vez por apertura.
let desbloqueadoEnEstaApertura = false;

export default function PerfilScreen() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [bioActiva, setBioActiva] = useState(false);
  const [bioDisponible, setBioDisponible] = useState(false);
  const [favoritos, setFavoritos] = useState<Lugar[]>([]);
  const [desbloqueado, setDesbloqueado] = useState(desbloqueadoEnEstaApertura);

  const cargar = useCallback(async () => {
    const [s, activa, disponible, ids] = await Promise.all([
      obtenerSesion(),
      biometriaActivada(),
      biometriaDisponible(),
      listarFavoritos(),
    ]);
    setSesion(s);
    setBioActiva(activa);
    setBioDisponible(disponible);

    // obtenerLugar usa la copia local del catálogo, así que funciona sin señal
    const lugares = await Promise.all(ids.map((id) => obtenerLugar(id).catch(() => null)));
    setFavoritos(lugares.filter((l): l is Lugar => l !== null));
  }, []);

  // Se recarga cada vez que se entra a la pestaña (por si se agregó un favorito en otra pantalla)
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const bloqueado = sesion !== null && bioActiva && !desbloqueado;

  async function entrarConHuella() {
    const ses = await ingresarConBiometria();
    if (ses) {
      desbloqueadoEnEstaApertura = true;
      setDesbloqueado(true);
    } else {
      Alert.alert('No se pudo verificar', 'Probá de nuevo o iniciá sesión con tu contraseña.');
    }
  }

  async function alternarBiometria() {
    if (bioActiva) {
      await desactivarBiometria();
      setBioActiva(false);
      return;
    }
    const ok = await activarBiometria();
    setBioActiva(ok);
    if (!ok) Alert.alert('No se activó', 'Verificá que el celular tenga huella o rostro registrado.');
  }

  async function salir() {
    await cerrarSesion();
    await desactivarBiometria();
    desbloqueadoEnEstaApertura = false;
    setDesbloqueado(false);
    await cargar();
  }

  if (bloqueado) {
    return (
      <View style={estilos.centro}>
        <Ionicons name="finger-print-outline" size={72} color={Colores.primario} />
        <Text style={estilos.titulo}>Ingreso rápido</Text>
        <Text style={estilos.texto}>Usá tu huella o rostro para entrar a tu cuenta.</Text>
        <Pressable onPress={entrarConHuella} style={estilos.botonPrincipal} accessibilityRole="button">
          <Text style={estilos.botonPrincipalTexto}>Ingresar con huella o rostro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>Yo</Text>

      <Text style={estilos.subtitulo}>Mis lugares favoritos</Text>
      {favoritos.length === 0 ? (
        <Text style={estilos.texto}>
          Todavía no guardaste ninguno. Tocá el corazón en el detalle de un lugar para agregarlo.
        </Text>
      ) : (
        favoritos.map((lugar) => (
          <View key={lugar.id} style={estilos.tarjeta}>
            <Pressable
              style={estilos.tarjetaTexto}
              onPress={() => router.push({ pathname: '/lugar/[id]', params: { id: lugar.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${lugar.nombre}`}
            >
              <Text style={estilos.tarjetaNombre}>{lugar.nombre}</Text>
              <Text style={estilos.tarjetaDetalle} numberOfLines={2}>
                {lugar.descripcionCorta}
              </Text>
            </Pressable>
            <BotonFavorito lugarId={lugar.id} />
          </View>
        ))
      )}

      <Text style={estilos.subtitulo}>Mi cuenta</Text>
      {sesion ? (
        <>
          <Text style={estilos.texto}>Sesión iniciada.</Text>
          {bioDisponible ? (
            <Pressable onPress={alternarBiometria} style={estilos.botonSecundario} accessibilityRole="button">
              <Ionicons name="finger-print-outline" size={24} color={Colores.primario} />
              <Text style={estilos.botonSecundarioTexto}>
                {bioActiva ? 'Desactivar ingreso con huella' : 'Activar ingreso con huella'}
              </Text>
            </Pressable>
          ) : (
            <Text style={estilos.texto}>Este celular no tiene huella o rostro registrado.</Text>
          )}
          <Pressable onPress={salir} style={estilos.botonSecundario} accessibilityRole="button">
            <Text style={estilos.botonSecundarioTexto}>Cerrar sesión</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={estilos.texto}>
            No hay una sesión iniciada. El catálogo y los favoritos funcionan igual; el inicio de sesión es para
            sincronizar tu recorrido.
          </Text>
          <Pressable onPress={() => router.push('./login')} style={estilos.botonPrincipal} accessibilityRole="button">
            <Text style={estilos.botonPrincipalTexto}>Iniciar sesión</Text>
          </Pressable>
        </>
      )}

      {/* SOLO PARA PROBAR: borrar cuando exista la pantalla de login real */}
      {__DEV__ && !sesion && (
        <Pressable
          onPress={async () => {
            await ingresarDemoSiHaceFalta();
            await cargar();
          }}
          style={estilos.botonSecundario}
          accessibilityRole="button"
        >
          <Text style={estilos.botonSecundarioTexto}>[Dev] Simular sesión</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: { padding: 20, paddingTop: 60, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: Colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: Colores.texto },
  subtitulo: { fontSize: 22, fontWeight: '800', color: Colores.texto, marginTop: 16 },
  texto: { fontSize: 18, lineHeight: 27, color: Colores.texto },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colores.fondoSuave,
  },
  tarjetaTexto: { flex: 1, minHeight: TOQUE_MINIMO, justifyContent: 'center' },
  tarjetaNombre: { fontSize: 18, fontWeight: '700', color: Colores.texto },
  tarjetaDetalle: { fontSize: 16, color: Colores.textoSecundario },
  botonPrincipal: {
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.primario,
  },
  botonPrincipalTexto: { fontSize: 18, fontWeight: '700', color: Colores.primarioTexto },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colores.primario,
    backgroundColor: Colores.fondo,
  },
  botonSecundarioTexto: { fontSize: 18, fontWeight: '700', color: Colores.primario, flexShrink: 1 },
});