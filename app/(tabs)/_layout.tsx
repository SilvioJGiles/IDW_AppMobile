import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs, router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colores, TOQUE_MINIMO } from "../../constants/colores";

// Botón de la barra de arriba de la pestaña Mapa: abre el catálogo (app/catalogo.tsx).
// Así la pestaña es el mapa del Integrante 2 y el catálogo del Integrante 1
// se abre a un toque, sin que ninguno modifique el archivo del otro.
function BotonVerLista() {
  return (
    <Pressable
      onPress={() => router.push("/catalogo")}
      style={({ pressed }) => [estilos.botonLista, pressed && estilos.botonPresionado]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Ver la lista de lugares"
    >
      <Ionicons name="list" size={22} color={Colores.primarioTexto} />
      <Text style={estilos.botonListaTexto}>Ver lista</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  // Espacio que ocupan los botones del sistema (atrás, inicio) o la barra de gestos.
  // Sin sumarlo, en Android la barra de pestañas queda tapada por esos botones.
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerTitleStyle: { fontSize: 20, fontWeight: "800" },
        tabBarActiveTintColor: Colores.primario,
        tabBarInactiveTintColor: Colores.textoSecundario,
        // Barra más alta que la de fábrica, para que entren el ícono y el nombre con letra grande
        tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
        tabBarStyle: { height: 68 + bottom, paddingTop: 6, paddingBottom: 8 + bottom },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          headerTitle: "Lugares de Colón",
          // Título a la izquierda para que no lo tape el botón "Ver lista"
          headerTitleAlign: "left",
          headerRight: () => <BotonVerLista />,
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="recorrido"
        options={{
          title: "Mi recorrido",
          tabBarIcon: ({ color, size }) => <Ionicons name="footsteps-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Yo",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  botonLista: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: TOQUE_MINIMO - 8,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: Colores.primario,
  },
  botonPresionado: {
    opacity: 0.8,
  },
  botonListaTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: Colores.primarioTexto,
  },
});
