import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colores } from "../../constants/colores";

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
