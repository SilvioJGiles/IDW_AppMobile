import Ionicons from "@react-native-vector-icons/ionicons";
import { StyleSheet, Text, View } from "react-native";

import { Colores } from "../constants/colores";
import { NombreIcono } from "../constants/iconos";

interface Props {
  icono: string;
  titulo: string;
  descripcion: string;
}

// Pantalla para las pestañas que todavía se están armando.
export function PantallaPendiente({ icono, titulo, descripcion }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icono as NombreIcono} size={64} color={Colores.primario} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
    backgroundColor: Colores.fondo,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: Colores.texto,
    textAlign: "center",
  },

  descripcion: {
    fontSize: 18,
    lineHeight: 26,
    color: Colores.textoSecundario,
    textAlign: "center",
  },
});
