import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colores } from '../constants/colores';
import { ErrorApi, ErrorRed, pedir } from '../src/servicios/cliente';
import { guardarSesion } from '../src/servicios/sesion';
import { sincronizar } from '../src/servicios/visitas';

interface RespuestaIngreso {
  token: string;
  usuario: { id: string };
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingresar() {
    if (!email.trim() || !contrasena) {
      setError('Completá el email y la contraseña.');
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const r = await pedir<RespuestaIngreso>('/auth/ingreso', {
        metodo: 'POST',
        cuerpo: { email: email.trim(), contrasena },
      });
      if (!r?.token) throw new ErrorApi('ERROR_INTERNO', 'La API no devolvió la sesión.', 500);
      await guardarSesion(r.token, r.usuario.id);
      void sincronizar().catch(() => undefined); // sube las visitas que habían quedado pendientes
      router.replace('/(tabs)/perfil');
    } catch (e) {
      if (e instanceof ErrorRed) setError('No hay conexión con el servidor.');
      else if (e instanceof ErrorApi) setError(e.message);
      else setError('Algo salió mal. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Ingresar</Text>

      <TextInput
        style={estilos.campo}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        accessibilityLabel="Email"
      />
      <TextInput
        style={estilos.campo}
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel="Contraseña"
      />

      {error && <Text style={estilos.error}>{error}</Text>}

      <Pressable onPress={ingresar} disabled={cargando} style={estilos.boton} accessibilityRole="button">
        {cargando ? <ActivityIndicator color={Colores.primarioTexto} /> : <Text style={estilos.botonTexto}>Ingresar</Text>}
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 24, gap: 14, justifyContent: 'center', backgroundColor: Colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: Colores.texto },
  campo: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: Colores.primario,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    color: Colores.texto,
    backgroundColor: Colores.fondo,
  },
  error: { fontSize: 16, color: Colores.error },
  boton: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.primario,
  },
  botonTexto: { fontSize: 18, fontWeight: '700', color: Colores.primarioTexto },
});