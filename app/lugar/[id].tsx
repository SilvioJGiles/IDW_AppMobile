import Ionicons from "@react-native-vector-icons/ionicons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ImagenLugar } from "../../components/ImagenLugar";
import { Colores, TOQUE_MINIMO } from "../../constants/colores";
import { NombreIcono } from "../../constants/iconos";
import { useCategorias, useLugar } from "../../src/consultas/lugares";
import { formatearDuracion, formatearPrecio } from "../../src/utils/formato";
import {
  NOMBRES_DIAS,
  ORDEN_SEMANA,
  estaAbiertoAhora,
  textoDia,
  textoEstado,
} from "../../src/utils/horarios";

// Detalle de un lugar: fotos, estado, descripción, datos, horarios de la semana
// y accesos a la audioguía y a registrar la visita.
export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  // Para que los horarios del final no queden debajo de los botones del sistema
  const { bottom } = useSafeAreaInsets();
  // Los parámetros siempre llegan como texto
  const consultaLugar = useLugar(String(id ?? ""));
  const consultaCategorias = useCategorias();

  const lugar = consultaLugar.data ?? null;
  const error = consultaLugar.isError && !lugar ? consultaLugar.error.message : null;

  const categoria = useMemo(
    () => consultaCategorias.data?.find((item) => item.id === lugar?.categoriaId),
    [consultaCategorias.data, lugar?.categoriaId],
  );

  const cargar = () => {
    consultaLugar.refetch();
  };

  if (consultaLugar.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colores.primario} />
      </View>
    );
  }

  if (error || !lugar) {
    return (
      <View style={styles.centro}>
        <Ionicons name="alert-circle-outline" size={56} color={Colores.error} />
        <Text style={styles.texto}>{error ?? "No existe ese lugar."}</Text>
        <Pressable onPress={cargar} style={styles.botonPrincipal} accessibilityRole="button">
          <Text style={styles.botonPrincipalTexto}>Reintentar</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.botonSecundario} accessibilityRole="button">
          <Text style={styles.botonSecundarioTexto}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const abierto = estaAbiertoAhora(lugar.horarios);
  const hoy = new Date().getDay();
  const fotos = lugar.imagenes.length > 0 ? lugar.imagenes : [""];

  return (
    <>
      <Stack.Screen options={{ title: lugar.nombre }} />

      <ScrollView style={styles.pantalla} contentContainerStyle={[styles.contenido, { paddingBottom: 40 + bottom }]}>
        {/* Galería: se desliza de a una foto */}
        <FlatList
          horizontal
          pagingEnabled
          data={fotos}
          keyExtractor={(uri, indice) => `${indice}-${uri}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ImagenLugar
              uri={item || undefined}
              style={{ width, aspectRatio: 4 / 3 }}
              descripcion={`${lugar.nombre}, foto ${index + 1} de ${lugar.imagenes.length}`}
            />
          )}
        />
        {lugar.imagenes.length > 1 && (
          <Text style={styles.ayudaGaleria}>Deslizá para ver las {lugar.imagenes.length} fotos</Text>
        )}

        <View style={styles.bloque}>
          {categoria && (
            <View style={styles.fila}>
              <Ionicons name={categoria.icono as NombreIcono} size={22} color={categoria.color} />
              <Text style={[styles.categoria, { color: categoria.color }]}>{categoria.nombre}</Text>
            </View>
          )}

          <Text style={styles.titulo}>{lugar.nombre}</Text>

          {lugar.horarios.length > 0 && (
            <Text style={[styles.estado, { color: abierto ? Colores.abierto : Colores.cerrado }]}>
              {textoEstado(lugar.horarios)}
            </Text>
          )}

          <Text style={styles.texto}>{lugar.descripcion}</Text>
        </View>

        {/* Acciones principales */}
        <View style={styles.bloque}>
          {lugar.audioguia && (
            <Pressable
              onPress={() =>
                Alert.alert("Audioguía", "La reproducción de audioguías se suma en la próxima etapa.")
              }
              style={styles.botonPrincipal}
              accessibilityRole="button"
              accessibilityLabel={`Escuchar audioguía, ${formatearDuracion(lugar.audioguia.duracionSegundos)} minutos`}
            >
              <Ionicons name="headset-outline" size={24} color={Colores.primarioTexto} />
              <Text style={styles.botonPrincipalTexto}>
                Escuchar audioguía {formatearDuracion(lugar.audioguia.duracionSegundos)}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/visita/nueva",
                params: { lugarId: lugar.id, origen: "manual" },
              })
            }
            style={styles.botonSecundario}
            accessibilityRole="button"
            accessibilityLabel="Registrar visita"
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={Colores.primario} />
            <Text style={styles.botonSecundarioTexto}>Registrar visita</Text>
          </Pressable>
        </View>

        {/* Datos */}
        <View style={styles.bloque}>
          <Text style={styles.subtitulo}>Información</Text>

          <Dato icono="location-outline" etiqueta="Dirección" valor={lugar.direccion} />
          <Dato icono="cash-outline" etiqueta="Entrada" valor={formatearPrecio(lugar.precioEntrada)} />
          <Dato
            icono="accessibility-outline"
            etiqueta="Silla de ruedas"
            valor={lugar.accesible ? "Accesible" : "No accesible"}
          />
          <Dato
            icono="call-outline"
            etiqueta="Teléfono"
            valor={lugar.telefono ?? "Sin teléfono"}
            onPress={lugar.telefono ? () => Linking.openURL(`tel:${lugar.telefono}`) : undefined}
          />
          {lugar.sitioWeb && (
            <Dato
              icono="globe-outline"
              etiqueta="Sitio web"
              valor={lugar.sitioWeb.replace(/^https?:\/\//, "")}
              onPress={() => Linking.openURL(lugar.sitioWeb as string)}
            />
          )}
        </View>

        {/* Horarios de la semana */}
        <View style={styles.bloque}>
          <Text style={styles.subtitulo}>Horarios</Text>

          {lugar.horarios.length === 0 ? (
            <Text style={styles.texto}>Sin horario fijo: se puede visitar en cualquier momento.</Text>
          ) : (
            ORDEN_SEMANA.map((dia) => (
              <View key={dia} style={[styles.diaFila, dia === hoy && styles.diaHoy]}>
                <Text style={[styles.diaNombre, dia === hoy && styles.negrita]}>
                  {NOMBRES_DIAS[dia]}
                  {dia === hoy ? " (hoy)" : ""}
                </Text>
                <Text style={[styles.diaHorario, dia === hoy && styles.negrita]}>
                  {textoDia(lugar.horarios, dia)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

function Dato({
  icono,
  etiqueta,
  valor,
  onPress,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  onPress?: () => void;
}) {
  const contenido = (
    <View style={styles.dato}>
      <Ionicons name={icono as NombreIcono} size={24} color={Colores.primario} />
      <View style={styles.datoTextos}>
        <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
        <Text style={[styles.datoValor, onPress && styles.enlace]}>{valor}</Text>
      </View>
    </View>
  );

  if (!onPress) {
    return contenido;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`${etiqueta}: ${valor}`}>
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },

  contenido: {
    paddingBottom: 40,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: Colores.fondo,
  },

  ayudaGaleria: {
    fontSize: 15,
    textAlign: "center",
    color: Colores.textoSecundario,
    paddingTop: 8,
  },

  bloque: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  categoria: {
    fontSize: 17,
    fontWeight: "700",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: Colores.texto,
  },

  estado: {
    fontSize: 18,
    fontWeight: "700",
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: Colores.texto,
  },

  texto: {
    fontSize: 18,
    lineHeight: 27,
    color: Colores.texto,
  },

  botonPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colores.primario,
  },

  botonPrincipalTexto: {
    fontSize: 18,
    fontWeight: "700",
    color: Colores.primarioTexto,
    flexShrink: 1,
  },

  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colores.primario,
    backgroundColor: Colores.fondo,
  },

  botonSecundarioTexto: {
    fontSize: 18,
    fontWeight: "700",
    color: Colores.primario,
    flexShrink: 1,
  },

  dato: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: TOQUE_MINIMO,
    paddingVertical: 6,
  },

  datoTextos: {
    flex: 1,
  },

  datoEtiqueta: {
    fontSize: 15,
    color: Colores.textoSecundario,
  },

  datoValor: {
    fontSize: 18,
    color: Colores.texto,
  },

  enlace: {
    color: Colores.primario,
    textDecorationLine: "underline",
  },

  diaFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  diaHoy: {
    backgroundColor: Colores.fondoSuave,
  },

  diaNombre: {
    fontSize: 18,
    color: Colores.texto,
  },

  diaHorario: {
    fontSize: 18,
    color: Colores.texto,
  },

  negrita: {
    fontWeight: "800",
  },
});
