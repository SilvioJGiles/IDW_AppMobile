// Formatos para mostrar datos en pantalla.

// Precio de entrada: 0 = gratis, null = no aplica
export function formatearPrecio(precio: number | null): string {
  if (precio === null) {
    return "No aplica";
  }

  if (precio === 0) {
    return "Gratis";
  }

  return `$ ${precio.toLocaleString("es-AR")}`;
}

// Duración de una audioguía: 252 → "4:12"
export function formatearDuracion(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = Math.round(segundos % 60);

  return `${minutos}:${resto.toString().padStart(2, "0")}`;
}
