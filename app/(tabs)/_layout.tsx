import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0a6c5b', tabBarLabelStyle: { fontSize: 14 } }}>
      <Tabs.Screen
        name="recorrido"
        options={{
          title: 'Mi recorrido',
          tabBarIcon: ({ color, size }) => <Ionicons name="footsteps" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
