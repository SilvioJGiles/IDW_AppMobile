import { Categoria } from "../tipos";

// Datos de prueba hasta que esté la API de la cátedra.
// "Alojamiento" no tiene lugares: sirve para probar la lista vacía.
export const categoriasMock: Categoria[] = [
  { id: "cat-playas", nombre: "Playas", icono: "sunny-outline", color: "#B26A00", orden: 1 },
  { id: "cat-termas", nombre: "Termas", icono: "water-outline", color: "#00658F", orden: 2 },
  { id: "cat-museos", nombre: "Museos y patrimonio", icono: "business-outline", color: "#8E5A4A", orden: 3 },
  { id: "cat-gastronomia", nombre: "Gastronomía", icono: "restaurant-outline", color: "#A4372B", orden: 4 },
  { id: "cat-artesanias", nombre: "Artesanías", icono: "color-palette-outline", color: "#7B3FA0", orden: 5 },
  { id: "cat-naturaleza", nombre: "Naturaleza", icono: "leaf-outline", color: "#2E7D32", orden: 6 },
  { id: "cat-alojamiento", nombre: "Alojamiento", icono: "bed-outline", color: "#37474F", orden: 7 },
];
