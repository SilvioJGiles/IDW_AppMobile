import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, FlatList, TouchableOpacity, Linking, Platform, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Magnetometer } from 'expo-sensors';
import { obtenerPosicion, calcularDistanciaKm } from '../../src/servicios/ubicacion';
import { listarLugares } from '../../src/servicios/lugares';
import type { Coordenadas } from '../../src/tipos';

const CATEGORIAS = [
  { id: 'todos', nombre: '🌟 Todos' },
  { id: 'cat-termas', nombre: '♨️ Termas' },
  { id: 'cat-museos', nombre: '🏛️ Museos' },
  { id: 'cat-playas', nombre: '🏖️ Playas' },
];

// Función para calcular el ángulo (rumbo) hacia el objetivo
function calcularRumbo(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

export default function PantallaMapa() {
  const [miUbicacion, setMiUbicacion] = useState<Coordenadas | null>(null);
  const [listaLugares, setListaLugares] = useState<any[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [anguloBrujula, setAnguloBrujula] = useState(0);

  useEffect(() => {
    async function prepararMapa() {
      try {
        const gps = await obtenerPosicion();
        let posActual = null;

        if (gps.ok) {
          posActual = gps.coordenadas;
          setMiUbicacion(posActual);
        }

        // 🚀 Acá llamamos a la API real a través de tu servicio de lugares
        const lugaresRemotos = await listarLugares();

        const lugaresArmados = lugaresRemotos.map((lugar: any) => {
          const distancia = posActual
            ? calcularDistanciaKm(posActual, lugar.coordenadas)
            : 0;
          
          const rumbo = posActual 
            ? calcularRumbo(posActual.latitud, posActual.longitud, lugar.coordenadas.latitud, lugar.coordenadas.longitud)
            : 0;

          return { ...lugar, distancia, rumbo };
        });

        lugaresArmados.sort((a, b) => a.distancia - b.distancia);
        setListaLugares(lugaresArmados);
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      } finally {
        setCargando(false);
      }
    }
    prepararMapa();

    // Activamos el magnetómetro para la brújula
    Magnetometer.setUpdateInterval(200);
    const suscripcion = Magnetometer.addListener((dado) => {
      let angulo = Math.atan2(dado.y, dado.x) * (180 / Math.PI);
      if (angulo < 0) angulo += 360;
      setAnguloBrujula(angulo);
    });

    return () => {
      suscripcion.remove();
    };
  }, []);

  const abrirComoLlegar = (lat: number, lon: number, nombre: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${nombre}@${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(nombre)})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Aviso", "No se pudo abrir la aplicación de mapas.");
      });
    }
  };

  if (cargando) {
    return (
      <View style={styles.pantallaCarga}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.textoAviso}>Conectando al servidor de la facultad...</Text>
      </View>
    );
  }

  const regionArranque = {
    latitude: miUbicacion ? miUbicacion.latitud : -32.2228,
    longitude: miUbicacion ? miUbicacion.longitud : -58.1398,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const lugaresFiltrados = categoriaSeleccionada === 'todos'
    ? listaLugares
    : listaLugares.filter((lugar) => lugar.categoriaId === categoriaSeleccionada);

  return (
    <View style={styles.contenedor}>
      {/* Filtros superiores */}
      <View style={styles.contenedorFiltros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.botonFiltro,
                categoriaSeleccionada === cat.id && styles.botonFiltroActivo
              ]}
              onPress={() => setCategoriaSeleccionada(cat.id)}
            >
              <Text style={[
                styles.textoFiltro,
                categoriaSeleccionada === cat.id && styles.textoFiltroActivo
              ]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mapa */}
      <MapView style={styles.mapaFondo} initialRegion={regionArranque} showsUserLocation={true}>
        {lugaresFiltrados.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{
              latitude: lugar.coordenadas.latitud,
              longitude: lugar.coordenadas.longitud,
            }}
            title={lugar.nombre}
            description={`A ${lugar.distancia} km de vos`}
          />
        ))}
      </MapView>

      {/* Tarjetas inferiores con indicador de brújula */}
      {lugaresFiltrados.length > 0 && (
        <View style={styles.cajaCercaTuyo}>
          <Text style={styles.titulo}>Lugares Cerca Tuyo (Servidor API)</Text>
          <FlatList
            horizontal
            data={lugaresFiltrados}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const rotacionFlecha = item.rumbo - anguloBrujula;
              return (
                <View style={styles.tarjetaLugar}>
                  <View style={styles.encabezadoTarjeta}>
                    <Text style={styles.nombreLugar} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={[styles.flechaBrujula, { transform: [{ rotate: `${rotacionFlecha}deg` }] }]}>
                      ➤
                    </Text>
                  </View>

                  <Text style={styles.textoDistancia}>📍 A {item.distancia} km</Text>
                  
                  <TouchableOpacity 
                    style={styles.botonRuta}
                    onPress={() => abrirComoLlegar(item.coordenadas.latitud, item.coordenadas.longitud, item.nombre)}
                  >
                    <Text style={styles.textoBotonRuta}>🚗 Cómo llegar</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  mapaFondo: { flex: 1 },
  pantallaCarga: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoAviso: { marginTop: 10, fontSize: 16 },
  
  contenedorFiltros: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    height: 45,
  },
  botonFiltro: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    height: 36,
    justifyContent: 'center',
  },
  botonFiltroActivo: { backgroundColor: '#007AFF' },
  textoFiltro: { fontSize: 13, fontWeight: '600', color: '#333' },
  textoFiltroActivo: { color: 'white' },

  cajaCercaTuyo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 10,
  },
  titulo: {
    marginLeft: 15,
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  tarjetaLugar: {
    backgroundColor: 'white',
    padding: 10,
    marginLeft: 15,
    borderRadius: 8,
    width: 190,
    justifyContent: 'space-between',
    elevation: 3, 
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreLugar: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111',
    flex: 1,
  },
  flechaBrujula: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  textoDistancia: {
    color: '#666',
    fontSize: 12,
    marginVertical: 2,
  },
  botonRuta: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  textoBotonRuta: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});