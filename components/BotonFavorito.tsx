import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { Colores, TOQUE_MINIMO } from '../constants/colores';
import { agregarFavorito, esFavorito, quitarFavorito } from '../src/servicios/favoritos';

export function BotonFavorito({ lugarId }: { lugarId: string }) {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    void esFavorito(lugarId).then(setActivo);
  }, [lugarId]);

  async function alternar() {
    const nuevo = !activo;
    setActivo(nuevo); // se ve al instante
    if (nuevo) await agregarFavorito(lugarId);
    else await quitarFavorito(lugarId);
  }

  return (
    <Pressable
      onPress={alternar}
      hitSlop={8}
      style={{ minHeight: TOQUE_MINIMO, minWidth: TOQUE_MINIMO, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityLabel={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Ionicons name={activo ? 'heart' : 'heart-outline'} size={30} color={activo ? Colores.error : Colores.primario} />
    </Pressable>
  );
}