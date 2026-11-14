import Ionicons from "@react-native-vector-icons/ionicons";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import { Colores, TOQUE_MINIMO } from "../constants/colores";
import { NombreIcono } from "../constants/iconos";
import { Categoria } from "../src/tipos";

interface Props {
  categorias: Categoria[];
  seleccionada: string | null;
  onSeleccionar: (categoriaId: string | null) => void;
}

type Opcion = { id: string | null; nombre: string; icono: string; color: string };

// Carrusel horizontal de categorías. "Todas" quita el filtro.
export function FiltroCategorias({ categorias, seleccionada, onSeleccionar }: Props) {
  const opciones: Opcion[] = [
    { id: null, nombre: "Todas", icono: "apps-outline", color: Colores.primario },
    ...categorias,
  ];

  return (
    <FlatList
      horizontal
      data={opciones}
      keyExtractor={(item) => item.id ?? "todas"}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => {
        const activa = item.id === seleccionada;

        return (
          <Pressable
            onPress={() => onSeleccionar(item.id)}
            style={[styles.chip, activa && { backgroundColor: item.color, borderColor: item.color }]}
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={`Filtrar por ${item.nombre}`}
          >
            <Ionicons
              name={item.icono as NombreIcono}
              size={20}
              color={activa ? Colores.primarioTexto : item.color}
            />
            <Text style={[styles.texto, activa && styles.textoActivo]}>{item.nombre}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },

  texto: {
    fontSize: 17,
    fontWeight: "700",
    color: Colores.texto,
  },

  textoActivo: {
    color: Colores.primarioTexto,
  },
});
