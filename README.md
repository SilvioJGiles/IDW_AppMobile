# Mi Ciudad — Guía turística de Colón

Aplicación móvil para el turista que visita Colón (Entre Ríos): lugares, mapa, agenda de eventos, recorrido y audioguías. Trabajo Final de **Desarrollo para Móviles 2026** (UNER), a partir del pedido de la Dirección de Turismo de la Municipalidad de Colón.

## Integrantes

| Integrante | Módulo | Rama |
|---|---|---|
| Jonathan Exequiel Moyano | Integrante 1: navegación base y catálogo de lugares | `feature/navegacion-catalogo` |
| Geronimo Leyes | Integrante 2: mapa, ubicación y "Cerca tuyo" | `feature/mapas-gps` |
| Silvio Jorge Giles | Integrante 3: Mi recorrido, QR, cámara y galería | `feature/qr-visitas` |
| Sabrina Bidal | Integrante 4: sin conexión, audioguías y cuenta | `feature/offline-audio-auth` |

## Entorno

- **Expo SDK 54**, React Native 0.81, React 19.1, TypeScript, Expo Router.
- Íconos: `@react-native-vector-icons/ionicons`.
- Datos: API de Mi Ciudad de la cátedra (`api-mi-ciudad`).

## Cómo correrla

1. Levantar la API (en su carpeta): `pnpm install`, `pnpm db:reiniciar` y `pnpm dev`. Al arrancar muestra la dirección para el teléfono, por ejemplo `http://192.168.0.10:3000`.
2. En este proyecto: copiar `.env.example` a `.env.local` y poner esa dirección en `EXPO_PUBLIC_API_URL` (no `localhost`: en Expo Go, `localhost` es el propio teléfono).
3. `npm ci` y `npx expo start`. Escanear el QR con **Expo Go para SDK 54**, con el teléfono en la misma wifi que la compu.

Si el teléfono no llega a la compu: la red de la PC tiene que estar como **Privada** en Windows, y Node.js permitido en el firewall.

## Verificación

```bash
npx tsc --noEmit          # tipos
npm test                  # tests (jest-expo)
npx expo install --check  # versiones compatibles con SDK 54
```

## Estructura

```text
app/
├── (tabs)/
│   ├── index.tsx        Mapa: catálogo de lugares (Integrante 1)
│   ├── agenda.tsx       pendiente
│   ├── recorrido.tsx    Mi recorrido (Integrante 3)
│   └── perfil.tsx       Yo: pendiente
├── lugar/[id].tsx       Detalle de un lugar (Integrante 1)
├── escaner.tsx          Lector de QR (Integrante 3)
├── visita/nueva.tsx     Registrar una visita (Integrante 3)
└── _layout.tsx          Stack raíz y TanStack Query

components/              LugarCard, FiltroCategorias, ImagenLugar, PantallaPendiente
constants/               colores, iconos
src/
├── tipos/index.ts       Tipos del PRD (no se tocan)
├── servicios/           cliente (fetch), lugares, categorias, visitas, sesion, ubicacion, …
├── consultas/           TanStack Query: cliente, lugares
├── mocks/               datos de prueba (tests)
└── utils/               horarios, formato, distancia, fechas, qr
__tests__/               lugares, horarios
```

## Reglas del grupo

- Nadie sube directo a `master`: cada uno trabaja en su rama y abre un Pull Request.
- `src/tipos/index.ts` y `src/servicios/` se cambian sólo con acuerdo del grupo.
- Todo pedido a la API pasa por `src/servicios/cliente.ts`.
