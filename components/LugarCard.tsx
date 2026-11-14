import Ionicons from "@react-native-vector-icons/ionicons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colores } from "../constants/colores";
import { NombreIcono } from "../constants/iconos";
import { Categoria, Lugar } from "../src/tipos";
import { estaAbiertoAhora, textoEstado } from "../src/utils/horarios";
import { ImagenLugar } from "./ImagenLugar";

interface Props {
  lugar: Lugar;
  categoria: Categoria | undefined;
  onPress: (id: string) => void;
}

// Tarjeta de un lugar en el catálogo. memo: no se vuelve a dibujar si no cambió.
function LugarCardBase({ lugar, categoria, onPress }: Props) {
  const abierto = estaAbiertoAhora(lugar.horarios);
  const estado = textoEstado(lugar.horarios);

  return (
    <Pressable
      onPress={() => onPress(lugar.id)}
      style={({ pressed }) => [styles.card, pressed && styles.presionada]}
      accessibilityRole="button"
      accessibilityLabel={`${lugar.nombre}. ${categoria?.nombre ?? ""}. ${estado}`}
      accessibilityHint="Abre el detalle del lugar"
    >
      <ImagenLugar uri={lugar.imagenes[0]} style={styles.imagen} descripcion={lugar.nombre} />

      <View style={styles.cuerpo}>
        {categoria && (
          <View style={styles.categoria}>
            <Ionicons name={categoria.icono as NombreIcono} size={18} color={categoria.color} />
            <Text style={[styles.categoriaTexto, { color: categoria.color }]}>{categoria.nombre}</Text>
          </View>
        )}

        <Text style={styles.nombre}>{lugar.nombre}</Text>

        <Text style={styles.descripcion} numberOfLines={3}>
          {lugar.descripcionCorta}
        </Text>

        {lugar.horarios.length > 0 && (
          <Text style={[styles.estado, { color: abierto ? Colores.abierto : Colores.cerrado }]}>
            {estado}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const LugarCard = memo(LugarCardBase);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: Colores.fondo,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colores.borde,
    overflow: "hidden",
  },

  presionada: {
    opacity: 0.85,
  },

  imagen: {
    width: "100%",
    aspectRatio: 16 / 9,
  },

  cuerpo: {
    padding: 16,
    gap: 6,
  },

  categoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoriaTexto: {
    fontSize: 15,
    fontWeight: "700",
  },

  nombre: {
    fontSize: 22,
    fontWeight: "800",
    color: Colores.texto,
  },

  descripcion: {
    fontSize: 17,
    lineHeight: 24,
    color: Colores.textoSecundario,
  },

  estado: {
    fontSize: 16,
    fontWeight: "700",
  },
});
