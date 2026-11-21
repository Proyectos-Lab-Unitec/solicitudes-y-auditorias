import { puedeVerModulo, type Modulo } from "./roles";
import type { Rol } from "./types";

const RUTAS: Array<{ prefijo: string; modulo: Modulo }> = [
  { prefijo: "/panel/usuarios", modulo: "usuarios" },
  { prefijo: "/panel/solicitudes", modulo: "solicitudes" },
  { prefijo: "/panel/compras", modulo: "compras" },
  { prefijo: "/panel/mantenimiento", modulo: "mantenimiento" },
  { prefijo: "/panel/descarte", modulo: "descarte" },
  { prefijo: "/panel/auditorias/5s", modulo: "auditorias-5s" },
  { prefijo: "/panel/auditorias/seguridad", modulo: "auditorias-seguridad" },
  { prefijo: "/panel/auditorias/computo", modulo: "auditorias-computo" },
];

function rutaLimpia(ruta: string) {
  return ruta.split("?")[0].split("#")[0];
}

export function moduloDeRuta(ruta: string): Modulo | null {
  const limpia = rutaLimpia(ruta);

  const encontrada = RUTAS.find(
    (item) => limpia === item.prefijo || limpia.startsWith(`${item.prefijo}/`)
  );

  return encontrada?.modulo ?? null;
}

/**
 * Indica si un rol puede entrar a una ruta interna después del login.
 */
export function puedeVerRuta(rol: Rol, ruta: string): boolean {
  const limpia = rutaLimpia(ruta);

  if (limpia === "/panel") return true;

  // La ruta genérica de auditorías redirige según el rol.
  if (limpia === "/panel/auditorias") {
    return (
      puedeVerModulo(rol, "auditorias-5s") ||
      puedeVerModulo(rol, "auditorias-seguridad") ||
      puedeVerModulo(rol, "auditorias-computo")
    );
  }

  const modulo = moduloDeRuta(limpia);
  return modulo ? puedeVerModulo(rol, modulo) : false;
}

/**
 * Solo acepta rutas internas del panel. Evita redirecciones abiertas.
 */
export function destinoSeguro(next?: string | null): string {
  if (!next) return "/panel";

  const limpio = next.trim();

  if (!limpio.startsWith("/panel")) return "/panel";
  if (limpio.startsWith("//") || limpio.includes("\\")) return "/panel";
  if (limpio.includes("..")) return "/panel";

  return limpio;
}
