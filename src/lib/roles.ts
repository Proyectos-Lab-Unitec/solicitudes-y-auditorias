import type { Rol } from "./types";

export type Modulo =
  | "usuarios"
  | "solicitudes"
  | "compras"
  | "mantenimiento"
  | "descarte"
  | "auditorias-5s"
  | "auditorias-seguridad"
  | "auditorias-computo"
  | "configuracion-trimestres";

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  usuario: "Usuario",
  consultor: "Consultor",
  checklist: "Checklist",
};

export const DESCRIPCION_ROL: Record<Rol, string> = {
  admin: "Administración, auditorías 5S, de seguridad y de cómputo",
  usuario: "Jefe de área / Instructor: compras, mantenimiento y descarte",
  consultor: "Consulta de solo lectura",
  checklist: "Auditorías de cómputo",
};

/**
 * Módulos visibles por rol.
 *
 * El admin administra usuarios y el flujo de aprobación de solicitudes, y
 * ejecuta las auditorías 5S y de seguridad. El usuario operativo genera las
 * solicitudes. Checklist solo trabaja con auditorías de cómputo. El consultor
 * ve todo en modo lectura.
 */
export const MODULOS_POR_ROL: Record<Rol, Modulo[]> = {
  admin: [
    "usuarios",
    "solicitudes",
    "auditorias-5s",
    "auditorias-seguridad",
    "auditorias-computo",
    "configuracion-trimestres",
  ],
  usuario: ["compras", "mantenimiento", "descarte"],
  checklist: ["auditorias-computo", "configuracion-trimestres"],
  consultor: [
    "compras",
    "mantenimiento",
    "descarte",
    "auditorias-5s",
    "auditorias-seguridad",
    "auditorias-computo",
  ],
};

export function puedeVerModulo(rol: Rol, modulo: Modulo) {
  return MODULOS_POR_ROL[rol].includes(modulo);
}

/** Admin y checklist son los únicos que pueden editar el calendario. */
export function puedeConfigurarTrimestres(rol: Rol) {
  return rol === "admin" || rol === "checklist";
}
