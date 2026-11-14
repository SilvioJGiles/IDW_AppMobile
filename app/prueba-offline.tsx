import { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { agregarFavorito, quitarFavorito, esFavorito, listarFavoritos } from '../src/servicios/favoritos';
import { biometriaDisponible, activarBiometria, ingresarConBiometria } from '../src/servicios/auth';
import { contarPendientes } from '../src/servicios/visitasLocal';
import { sincronizar } from '../src/servicios/visitas';

export default function PruebaOffline() {
  const [log, setLog] = useState<string[]>([]);
  const escribir = (m: string) => setLog((p) => [m, ...p]);

  return (
    <ScrollView contentContainerStyle={s.cont}>
      <Text style={s.titulo}>Prueba módulo offline</Text>

      <Text style={s.sec}>Favoritos</Text>
      <Button title="Agregar lug-001" onPress={async () => { await agregarFavorito('lug-001'); escribir('Favorito agregado'); }} />
      <Button title="Quitar lug-001" onPress={async () => { await quitarFavorito('lug-001'); escribir('Favorito quitado'); }} />
      <Button title="Consultar" onPress={async () => escribir(`esFavorito: ${await esFavorito('lug-001')} | lista: ${(await listarFavoritos()).join(', ') || '(vacía)'}`)} />

      <Text style={s.sec}>Cola de visitas (de Integrante 3)</Text>
      <Button title="Contar pendientes" onPress={async () => escribir(`Pendientes: ${await contarPendientes()}`)} />
      <Button title="Sincronizar" onPress={async () => {
        const r = await sincronizar();
        escribir(`Enviadas: ${r.enviadas} | pendientes: ${r.pendientes} | sin sesión: ${r.sinSesion}`);
      }} />

      <Text style={s.sec}>Biometría</Text>
      <Button title="¿Disponible?" onPress={async () => escribir(`Disponible: ${await biometriaDisponible()}`)} />
      <Button title="Activar ingreso rápido" onPress={async () => escribir(`Activada: ${await activarBiometria()}`)} />
      <Button title="Ingresar con huella" onPress={async () => {
        const ses = await ingresarConBiometria();
        escribir(ses ? `OK, usuario ${ses.usuarioId}` : 'Sin sesión o cancelado');
      }} />

      <Text style={s.sec}>Resultados</Text>
      {log.map((l, i) => <Text key={i}>• {l}</Text>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  cont: { padding: 20, paddingTop: 60, gap: 8 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  sec: { fontSize: 16, fontWeight: '600', marginTop: 16 },
});