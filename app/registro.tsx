import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Colores } from '../constants/colores';
import { marcarDesbloqueado } from '../src/servicios/auth';
import { ErrorApi, ErrorRed, pedir } from '../src/servicios/cliente';
import { guardarSesion } from '../src/servicios/sesion';

// La API responde al registro igual que al ingreso: devuelve la sesión ya iniciada,
// así el usuario no tiene que volver a escribir sus datos después de crear la cuenta.
interface RespuestaRegistro {
  token: string;
  usuario: { id: string };
}

const MIN_CONTRASENA = 8;

export default function RegistroScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [repetir, setRepetir] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validamos acá lo que se puede validar sin red: el error aparece al instante
  // y no gastamos una llamada a la API que igual iba a rechazar los datos.
  function validar(): string | null {
    if (!nombre.trim() || !email.trim() || !contrasena) return 'Completá todos los campos.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'El email no parece válido.';
    if (contrasena.length < MIN_CONTRASENA) return `La contraseña tiene que tener al menos ${MIN_CONTRASENA} caracteres.`;
    if (contrasena !== repetir) return 'Las contraseñas no coinciden.';
    return null;
  }

  async function registrarse() {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const r = await pedir<RespuestaRegistro>('/auth/registro', {
        metodo: 'POST',
        cuerpo: { nombre: nombre.trim(), email: email.trim(), contrasena },
      });
      if (!r?.token) throw new ErrorApi('ERROR_INTERNO', 'La API no devolvió la sesión.', 500);
      await guardarSesion(r.token, r.usuario.id); // el token va a expo-secure-store (req. 2)
      marcarDesbloqueado();
      router.replace('/(tabs)/perfil');
    } catch (e) {
      // El mensaje de ErrorApi viene de la API (por ejemplo, "el email ya está registrado")
      if (e instanceof ErrorRed) setError('No hay conexión con el servidor.');
      else if (e instanceof ErrorApi) setError(e.message);
      else setError('Algo salió mal. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Crear cuenta</Text>

      <TextInput
        style={estilos.campo}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        autoComplete="name"
        accessibilityLabel="Nombre"
      />
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
        placeholder={`Contraseña (mínimo ${MIN_CONTRASENA} caracteres)`}
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        accessibilityLabel="Contraseña"
      />
      <TextInput
        style={estilos.campo}
        placeholder="Repetí la contraseña"
        value={repetir}
        onChangeText={setRepetir}
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel="Repetir contraseña"
      />

      {error && <Text style={estilos.error}>{error}</Text>}

      <Pressable onPress={registrarse} disabled={cargando} style={estilos.boton} accessibilityRole="button">
        {cargando ? (
          <ActivityIndicator color={Colores.primarioTexto} />
        ) : (
          <Text style={estilos.botonTexto}>Crear cuenta</Text>
        )}
      </Pressable>

      <Link href="/login" replace style={estilos.enlace}>
        ¿Ya tenés cuenta? Ingresá
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: Colores.fondo },
  pantalla: { flexGrow: 1, padding: 24, gap: 14, justifyContent: 'center' },
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
  enlace: { fontSize: 17, color: Colores.primario, textAlign: 'center', paddingVertical: 12 },
});
