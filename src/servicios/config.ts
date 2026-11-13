// Base de la API. En desarrollo: la IP de tu compu en la wifi (NO localhost).
// Se define en .env como EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.10:3000').replace(/\/$/, '');
