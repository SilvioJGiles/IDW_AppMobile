import { debeReintentar } from "../src/consultas/cliente";
import { lugaresMock } from "../src/mocks/lugares";
import { ErrorApi, ErrorRed } from "../src/servicios/cliente";
import { filtrarLugares, normalizarTexto } from "../src/servicios/lugares";
import { formatearDuracion, formatearPrecio } from "../src/utils/formato";

// El servicio guarda una copia en el teléfono; en los tests no hace falta
jest.mock("expo-sqlite/kv-store", () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => undefined) },
}));

describe("búsqueda y filtro del catálogo", () => {
  it("no muestra los lugares dados de baja", () => {
    const visibles = filtrarLugares(lugaresMock, {});

    expect(visibles.length).toBeGreaterThan(0);
    expect(visibles.every((lugar) => lugar.activo)).toBe(true);
    expect(visibles.length).toBeLessThan(lugaresMock.length);
  });

  it("busca por nombre sin importar tildes ni mayúsculas", () => {
    expect(filtrarLugares(lugaresMock, { texto: "colon" }).map((lugar) => lugar.id)).toEqual(["lug-001"]);
    expect(normalizarTexto("  MUSÉO ")).toBe("museo");
  });

  it("filtra por categoría", () => {
    const museos = filtrarLugares(lugaresMock, { categoriaId: "cat-museos" });

    expect(museos.every((lugar) => lugar.categoriaId === "cat-museos")).toBe(true);
    expect(museos.length).toBe(2);
  });

  it("combina texto y categoría", () => {
    expect(filtrarLugares(lugaresMock, { texto: "molino", categoriaId: "cat-playas" })).toEqual([]);
  });

  it("devuelve una lista vacía para una categoría sin lugares", () => {
    expect(filtrarLugares(lugaresMock, { categoriaId: "cat-alojamiento" })).toEqual([]);
  });
});

describe("reintentos de TanStack Query", () => {
  it("no reintenta si el lugar no existe (404)", () => {
    expect(debeReintentar(0, new ErrorApi("LUGAR_NO_ENCONTRADO", "No existe ese lugar.", 404))).toBe(false);
  });

  it("reintenta dos veces sin conexión o con un error del servidor", () => {
    expect(debeReintentar(0, new ErrorRed())).toBe(true);
    expect(debeReintentar(1, new ErrorApi("ERROR_INTERNO", "Algo salió mal.", 500))).toBe(true);
    expect(debeReintentar(2, new ErrorRed())).toBe(false);
  });
});

describe("formatos", () => {
  it("muestra el precio de entrada", () => {
    expect(formatearPrecio(0)).toBe("Gratis");
    expect(formatearPrecio(null)).toBe("No aplica");
    expect(formatearPrecio(1500)).toMatch(/^\$ 1.?500$/);
  });

  it("muestra la duración de la audioguía", () => {
    expect(formatearDuracion(252)).toBe("4:12");
    expect(formatearDuracion(65)).toBe("1:05");
  });
});
