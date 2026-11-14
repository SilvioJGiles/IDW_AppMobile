import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';

// Pantalla de bienvenida animada (req. 10: identidad de la aplicación).
//
// Android solo permite un splash nativo con color de fondo y logo centrado.
// Para mostrar una imagen a pantalla completa, hacemos esto:
//   1. app/_layout.tsx retiene el splash nativo (preventAutoHideAsync).
//   2. Esta pantalla se dibuja encima de la app y, cuando la imagen ya cargó,
//      oculta el splash nativo: así no se ve un parpadeo en blanco entre los dos.
//   3. Anima la imagen y el logo, espera un momento y se desvanece.
// Mientras tanto, la app ya se está cargando por debajo.

const FONDO = require('../assets/images/bienvenida.jpg');
const LOGO = require('../assets/images/logo-colon.png');

const MS_ENTRADA_FONDO = 700;
const MS_PAUSA = 900;
const MS_SALIDA = 350;
const MS_SEGURIDAD = 4000; // si la imagen no carga, igual se entra a la app

interface Props {
  alTerminar: () => void;
}

export function Bienvenida({ alTerminar }: Props) {
  // Animated.Value: números que la animación va cambiando de 0 a 1.
  // useNativeDriver: true hace que la animación corra en el hilo nativo y no se trabe.
  const fondo = useRef(new Animated.Value(0)).current;
  const tarjeta = useRef(new Animated.Value(0)).current;
  const salida = useRef(new Animated.Value(1)).current;
  const arranco = useRef(false);
  const termino = useRef(false);

  const terminar = useCallback(() => {
    if (termino.current) return; // tocar la pantalla y el fin de la animación no deben disparar dos veces
    termino.current = true;
    Animated.timing(salida, { toValue: 0, duration: MS_SALIDA, useNativeDriver: true }).start(() => alTerminar());
  }, [alTerminar, salida]);

  const arrancar = useCallback(async () => {
    if (arranco.current) return;
    arranco.current = true;
    await SplashScreen.hideAsync().catch(() => undefined);

    // Si la persona activó "reducir movimiento" en su teléfono, mostramos todo quieto
    const reducirMovimiento = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    if (reducirMovimiento) {
      fondo.setValue(1);
      tarjeta.setValue(1);
      setTimeout(terminar, MS_PAUSA + 300);
      return;
    }

    Animated.sequence([
      Animated.timing(fondo, {
        toValue: 1,
        duration: MS_ENTRADA_FONDO,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tarjeta, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.delay(MS_PAUSA),
    ]).start(({ finished }) => {
      if (finished) terminar();
    });
  }, [fondo, tarjeta, terminar]);

  // Red de seguridad: nunca dejar al usuario trabado en la bienvenida
  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
      terminar();
    }, MS_SEGURIDAD);
    return () => clearTimeout(t);
  }, [terminar]);

  // Valores derivados: interpolate traduce el 0→1 a lo que necesita cada propiedad
  const escalaFondo = fondo.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] });
  const subidaTarjeta = tarjeta.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilos.capa, { opacity: salida }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={terminar} accessibilityLabel="Entrar a la aplicación">
        <Animated.Image
          source={FONDO}
          onLoadEnd={arrancar}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { opacity: fondo, transform: [{ scale: escalaFondo }] }]}
          accessibilityIgnoresInvertColors
        />

        <View style={estilos.centro}>
          <Animated.View style={{ opacity: tarjeta, transform: [{ translateY: subidaTarjeta }] }}>
            <View style={estilos.tarjeta}>
              <Image source={LOGO} style={estilos.logo} resizeMode="contain" accessibilityLabel="Colón, Entre Ríos" />
            </View>
            <Text style={estilos.titulo}>Mi Ciudad</Text>
            <Text style={estilos.subtitulo}>Guía turística de Colón</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const sombraTexto = {
  textShadowColor: 'rgba(0, 0, 0, 0.45)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 6,
};

const estilos = StyleSheet.create({
  // Fondo blanco igual al splash nativo: si la imagen tarda, no se nota el cambio
  capa: { backgroundColor: '#FFFFFF', zIndex: 200, elevation: 200 },
  // top en % se mide sobre el alto de la pantalla (paddingTop en % usaría el ancho):
  // así el bloque queda en el cielo, arriba del sol, en cualquier teléfono
  centro: { position: 'absolute', top: '11%', left: 0, right: 0, alignItems: 'center' },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 26,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  logo: { width: 220, height: 110 },
  titulo: { marginTop: 22, fontSize: 40, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', ...sombraTexto },
  subtitulo: { marginTop: 4, fontSize: 19, fontWeight: '600', color: '#FFF4E0', textAlign: 'center', ...sombraTexto },
});
