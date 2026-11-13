import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FiltroCategorias } from "../../components/FiltroCategorias";
import { LugarCard } from "../../components/LugarCard";
import { Colores, TOQUE_MINIMO } from "../../constants/colores";
import { useCategorias, useLugares } from "../../src/consultas/lugares";
import { filtrarLugares } from "../../src/servicios/lugares";
import { Categoria, Lugar } from "../../src/tipos";

const SIN_LUGARES: Lugar[] = [];
const SIN_CATEGORIAS: Categoria[] = [];

// Catálogo de lugares: búsqueda por nombre, filtro por categoría y listado.
// Los lugares se piden una vez a la API (TanStack Query los guarda) y se filtran en memoria.
export default function LugaresScreen() {
  const consultaLugares = useLugares();
  const consultaCategorias = useCategorias();
  const [texto, setTexto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const lugares = consultaLugares.data ?? SIN_LUGARES;
  const categorias = consultaCategorias.data ?? SIN_CATEGORIAS;

  const { refetch: refrescarLugares } = consultaLugares;
  const { refetch: refrescarCategorias } = consultaCategorias;

  const cargar = useCallback(() => {
    refrescarLugares();
    refrescarCategorias();
  }, [refrescarLugares, refrescarCategorias]);

  const visibles = useMemo(
    () => filtrarLugares(lugares, { texto, categoriaId }),
    [lugares, texto, categoriaId],
  );

  const categoriaPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias],
  );

  const abrirLugar = useCallback((id: string) => {
    router.push({ pathname: "/lugar/[id]", params: { id } });
  }, []);

  // Cargando: sólo la primera vez, cuando todavía no hay ninguna copia
  if (consultaLugares.isPending) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colores.primario} />
        <Text style={styles.mensaje}>Cargando lugares…</Text>
      </View>
    );
  }

  // Error: sólo si no hay datos para mostrar (si ya había, se siguen viendo)
  if (consultaLugares.isError && !consultaLugares.data) {
    return (
      <View style={styles.centro}>
        <Ionicons name="cloud-offline-outline" size={56} color={Colores.error} />
        <Text style={styles.mensaje}>
          {consultaLugares.error.message || "No se pudieron cargar los lugares."}
        </Text>
        <Pressable
          onPress={cargar}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
        >
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={visibles}
      keyExtractor={(lugar) => lugar.id}
      renderItem={({ item }) => (
        <LugarCard lugar={item} categoria={categoriaPorId.get(item.categoriaId)} onPress={abrirLugar} />
      )}
      contentContainerStyle={styles.lista}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={consultaLugares.isRefetching}
          onRefresh={cargar}
          colors={[Colores.primario]}
          tintColor={Colores.primario}
        />
      }
      initialNumToRender={6}
      windowSize={7}
      ListHeaderComponent={
        <View style={styles.encabezado}>
          <View style={styles.buscador}>
            <Ionicons name="search" size={24} color={Colores.textoSecundario} />
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar un lugar"
              placeholderTextColor={Colores.textoSecundario}
              style={styles.input}
              returnKeyType="search"
              accessibilityLabel="Buscar un lugar por nombre"
            />
            {texto.length > 0 && (
              <Pressable
                onPress={() => setTexto("")}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
              >
                <Ionicons name="close-circle" size={24} color={Colores.textoSecundario} />
              </Pressable>
            )}
          </View>

          <FiltroCategorias
            categorias={categorias}
            seleccionada={categoriaId}
            onSeleccionar={setCategoriaId}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.vacio}>
          <Ionicons name="map-outline" size={48} color={Colores.textoSecundario} />
          <Text style={styles.mensaje}>No hay lugares para mostrar.</Text>
          {(texto.length > 0 || categoriaId) && (
            <Pressable
              onPress={() => {
                setTexto("");
                setCategoriaId(null);
              }}
              style={styles.boton}
              accessibilityRole="button"
            >
              <Text style={styles.botonTexto}>Ver todos</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    paddingBottom: 32,
    gap: 16,
    backgroundColor: Colores.fondoSuave,
    flexGrow: 1,
  },

  encabezado: {
    gap: 12,
    paddingTop: 16,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },

  input: {
    flex: 1,
    fontSize: 18,
    color: Colores.texto,
    paddingVertical: 12,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: Colores.fondo,
  },

  vacio: {
    alignItems: "center",
    gap: 12,
    padding: 32,
  },

  mensaje: {
    fontSize: 18,
    textAlign: "center",
    color: Colores.texto,
  },

  boton: {
    minHeight: TOQUE_MINIMO,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    backgroundColor: Colores.primario,
  },

  botonTexto: {
    fontSize: 18,
    fontWeight: "700",
    color: Colores.primarioTexto,
  },
});
