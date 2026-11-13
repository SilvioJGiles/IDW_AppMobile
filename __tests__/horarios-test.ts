import { Horario } from "../src/tipos";
import { estaAbiertoAhora, textoDia, textoEstado } from "../src/utils/horarios";

// Martes con dos turnos (cortado al mediodía) y lunes cerrado
const horarios: Horario[] = [
  { dia: 2, abre: "08:00", cierra: "12:00" },
  { dia: 2, abre: "16:00", cierra: "20:00" },
];

// 10/11/2026 es martes y 09/11/2026 es lunes
const martes = (hora: string) => new Date(`2026-11-10T${hora}:00`);

describe("horarios", () => {
  it("está abierto dentro de un turno", () => {
    expect(estaAbiertoAhora(horarios, martes("09:30"))).toBe(true);
    expect(estaAbiertoAhora(horarios, martes("17:00"))).toBe(true);
  });

  it("está cerrado al mediodía, al cierre exacto y de noche", () => {
    expect(estaAbiertoAhora(horarios, martes("13:00"))).toBe(false);
    expect(estaAbiertoAhora(horarios, martes("12:00"))).toBe(false);
    expect(estaAbiertoAhora(horarios, martes("21:00"))).toBe(false);
  });

  it("está cerrado un día sin horarios", () => {
    expect(estaAbiertoAhora(horarios, new Date("2026-11-09T10:00:00"))).toBe(false);
  });

  it("arma el texto de estado", () => {
    expect(textoEstado(horarios, martes("09:30"))).toBe("Abierto ahora · cierra 12:00");
    expect(textoEstado(horarios, martes("13:00"))).toBe("Cerrado · abre a las 16:00");
    expect(textoEstado(horarios, martes("21:00"))).toBe("Cerrado ahora");
    expect(textoEstado([], martes("10:00"))).toBe("Sin horario fijo");
  });

  it("arma el texto de cada día de la semana", () => {
    expect(textoDia(horarios, 2)).toBe("08:00 a 12:00 y 16:00 a 20:00");
    expect(textoDia(horarios, 1)).toBe("Cerrado");
  });
});
