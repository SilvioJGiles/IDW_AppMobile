// Servicio de categorías: GET /categorias (la API ya las manda por "orden").

import type { Categoria } from "../tipos";
import { pedirLista } from "./cliente";

export async function obtenerCategorias(): Promise<Categoria[]> {
  const categorias = await pedirLista<Categoria>("/categorias");

  return [...categorias].sort((a, b) => a.orden - b.orden);
}
