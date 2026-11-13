const dos = (n: number) => String(n).padStart(2, '0');

/** ISO con zona, como pide la API: 2026-11-13T16:42:00-03:00 (usa la zona del teléfono). */
export function isoConZona(d: Date = new Date()): string {
  const off = -d.getTimezoneOffset();
  const signo = off >= 0 ? '+' : '-';
  const h = dos(Math.floor(Math.abs(off) / 60));
  const m = dos(Math.abs(off) % 60);
  return (
    `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}` +
    `T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}${signo}${h}:${m}`
  );
}

export function formatearFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} · ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
