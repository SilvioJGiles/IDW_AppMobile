import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { leerBorrador } from '../servicios/borradorVisita';

/**
 * Si Android cerró la app mientras la cámara estaba abierta, al volver a abrirse
 * hay un borrador guardado: llevamos al usuario de nuevo a "Registrar visita"
 * para que la pantalla recupere la foto y la nota (ver servicios/borradorVisita.ts).
 */
export function useRecuperarVisita() {
  // La navegación todavía no existe en el primer instante: navegar antes da error.
  // navegacion.key aparece cuando el navegador ya está montado.
  const navegacion = useRootNavigationState();
  const revisado = useRef(false);

  useEffect(() => {
    if (!navegacion?.key || revisado.current) return;
    revisado.current = true; // solo una vez por apertura de la app

    void leerBorrador().then((b) => {
      if (!b) return;
      router.push({
        pathname: '/visita/nueva',
        params: { lugarId: b.lugarId, origen: b.origen, recuperar: '1' },
      });
    });
  }, [navegacion?.key]);
}
