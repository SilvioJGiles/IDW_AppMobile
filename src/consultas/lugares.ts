// Consultas de lugares y categorías con TanStack Query (useQuery).
// La queryKey es la identidad del dato: todo lo que cambia el resultado va adentro.

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorApi } from "../servicios/cliente";
import { obtenerCategorias } from "../servicios/categorias";
import { listarLugares, obtenerLugar } from "../servicios/lugares";
import type { Lugar } from "../tipos";

export const claves = {
  lugares: ["lugares"] as const,
  lugar: (id: string) => ["lugares", id] as const,
  categorias: ["categorias"] as const,
};

// Lista completa de lugares activos (se filtra en memoria en la pantalla)
export function useLugares() {
  return useQuery({
    queryKey: claves.lugares,
    queryFn: listarLugares,
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: claves.categorias,
    queryFn: obtenerCategorias,
    staleTime: 60 * 60 * 1000, // las categorías casi no cambian
  });
}

// Un lugar que no existe (o está dado de baja) es un error para la pantalla de detalle
async function traerLugar(id: string): Promise<Lugar> {
  const lugar = await obtenerLugar(id);

  if (!lugar) {
    throw new ErrorApi("LUGAR_NO_ENCONTRADO", "No existe ese lugar.", 404);
  }

  return lugar;
}

// Detalle: si el lugar ya vino en la lista, se muestra al instante con esos datos
// y se pide igual para tener la versión más nueva.
export function useLugar(id: string) {
  const cliente = useQueryClient();

  return useQuery({
    queryKey: claves.lugar(id),
    queryFn: () => traerLugar(id),
    enabled: id.length > 0,
    placeholderData: () =>
      cliente.getQueryData<Lugar[]>(claves.lugares)?.find((lugar) => lugar.id === id),
  });
}
