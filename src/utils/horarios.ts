// Horarios de un lugar. "Abierto ahora" se calcula en el teléfono con la hora
// del dispositivo: no viene de la API.

import { Horario } from "../tipos";

export const NOMBRES_DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Orden para mostrar la semana: de lunes a domingo
export const ORDEN_SEMANA: Horario["dia"][] = [1, 2, 3, 4, 5, 6, 0];

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function tramosDelDia(horarios: Horario[], dia: Horario["dia"]): Horario[] {
  return horarios
    .filter((horario) => horario.dia === dia)
    .sort((a, b) => aMinutos(a.abre) - aMinutos(b.abre));
}

export function estaAbiertoAhora(horarios: Horario[], fecha: Date = new Date()): boolean {
  const minutos = fecha.getHours() * 60 + fecha.getMinutes();
  const dia = fecha.getDay() as Horario["dia"];

  return tramosDelDia(horarios, dia).some(
    (tramo) => minutos >= aMinutos(tramo.abre) && minutos < aMinutos(tramo.cierra),
  );
}

// Texto corto para el listado y el detalle: "Abierto ahora · cierra 19:00"
export function textoEstado(horarios: Horario[], fecha: Date = new Date()): string {
  if (horarios.length === 0) {
    return "Sin horario fijo";
  }

  const minutos = fecha.getHours() * 60 + fecha.getMinutes();
  const dia = fecha.getDay() as Horario["dia"];
  const tramos = tramosDelDia(horarios, dia);

  const actual = tramos.find(
    (tramo) => minutos >= aMinutos(tramo.abre) && minutos < aMinutos(tramo.cierra),
  );

  if (actual) {
    return `Abierto ahora · cierra ${actual.cierra}`;
  }

  const proximo = tramos.find((tramo) => aMinutos(tramo.abre) > minutos);

  if (proximo) {
    return `Cerrado · abre a las ${proximo.abre}`;
  }

  return "Cerrado ahora";
}

// "09:00 a 12:00 y 16:00 a 20:00" o "Cerrado"
export function textoDia(horarios: Horario[], dia: Horario["dia"]): string {
  const tramos = tramosDelDia(horarios, dia);

  if (tramos.length === 0) {
    return "Cerrado";
  }

  return tramos.map((tramo) => `${tramo.abre} a ${tramo.cierra}`).join(" y ");
}
