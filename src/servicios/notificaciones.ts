import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Qué hacer si llega una notificación con la app abierta: mostrarla como banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function pedirPermiso(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // En Android 13+ el permiso solo se puede pedir si ya existe un canal.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Visitas',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

/**
 * Notificación local disparada por un hecho real: se registró una visita.
 * Nunca lanza error: sin permiso o ante cualquier falla, la app sigue andando.
 */
export async function avisarVisitaRegistrada(nombreLugar: string): Promise<void> {
  try {
    if (!(await pedirPermiso())) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Visita registrada!',
        body: `Sumaste ${nombreLugar} a tu recorrido.`,
      },
      trigger: null, // se muestra en el momento
    });
  } catch (e) {
    console.warn('No se pudo mostrar la notificación', e);
  }
}
