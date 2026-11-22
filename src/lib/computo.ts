export const CATEGORIAS = ["Hardware", "Software"] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const TRIMESTRES = ["Q1", "Q2", "Q3", "Q4"] as const;

export type Trimestre = (typeof TRIMESTRES)[number];

export type EstadoAuditoria = "borrador" | "completada";

export const ESTADOS_RESPUESTA = ["pendiente", "ok"] as const;

export type EstadoRespuesta = (typeof ESTADOS_RESPUESTA)[number];

export const ETIQUETA_RESPUESTA: Record<EstadoRespuesta, string> = {
  pendiente: "Sin marcar",
  ok: "OK",
};

export const CLASE_RESPUESTA: Record<EstadoRespuesta, string> = {
  pendiente: "bg-slate-100 text-slate-700 ring-slate-200",
  ok: "bg-green-50 text-green-700 ring-green-100",
};

export const ETIQUETA_AUDITORIA: Record<EstadoAuditoria, string> = {
  borrador: "Borrador",
  completada: "Completada",
};

export const CLASE_AUDITORIA: Record<EstadoAuditoria, string> = {
  borrador: "bg-amber-50 text-amber-700 ring-amber-100",
  completada: "bg-green-50 text-green-700 ring-green-100",
};

/** Fecha de hoy en la zona horaria de UNITEC (El Salvador). */
export function fechaHoy() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
  }).format(new Date());
}

/** Año actual en la zona horaria de UNITEC. */
export function anioActual() {
  return Number(fechaHoy().slice(0, 4));
}

function aFechaUTC(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

export function sumarDias(fecha: string, dias: number) {
  const date = aFechaUTC(fecha);
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDeSemana(fecha: string) {
  const date = aFechaUTC(fecha);
  const dia = date.getUTCDay();
  const offset = dia === 0 ? -6 : 1 - dia;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** Primer lunes en la fecha indicada o después (nunca antes). */
function primerLunesDesde(fecha: string) {
  const date = aFechaUTC(fecha);
  const dia = date.getUTCDay();
  const offset = dia === 1 ? 0 : dia === 0 ? 1 : 8 - dia;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/**
 * Lunes de la semana 1 de un trimestre.
 *
 * Los trimestres son naturales (Q1 = enero–marzo, etc.) y cada uno tiene 10
 * semanas. La semana 1 empieza el primer lunes del trimestre.
 */
export function inicioTrimestre(trimestre: Trimestre, anio: number) {
  const mes = String(TRIMESTRES.indexOf(trimestre) * 3 + 1).padStart(2, "0");
  return primerLunesDesde(`${anio}-${mes}-01`);
}

/** Fechas de lunes a viernes. */
export function fechasDeSemana(lunes: string) {
  return [0, 1, 2, 3, 4].map((indice) => sumarDias(lunes, indice));
}

export function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}

export function formatearSemana(lunes: string) {
  const fechas = fechasDeSemana(lunes);
  return `${formatearFecha(fechas[0])} – ${formatearFecha(fechas[4])}`;
}

/** Rango compacto de la semana: "05/01 – 09/01". */
export function formatearSemanaCorta(lunes: string) {
  const fechas = fechasDeSemana(lunes);
  const corta = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
  return `${corta(fechas[0])} – ${corta(fechas[4])}`;
}

/** Trimestre natural en que cae hoy. */
export function trimestreActual(): Trimestre {
  const mes = Number(fechaHoy().slice(5, 7));
  return TRIMESTRES[Math.floor((mes - 1) / 3)];
}

/** Semana 1–10 del trimestre en que cae hoy, según el calendario canónico. */
export function semanaActual(trimestre: Trimestre, anio: number) {
  const inicio = aFechaUTC(inicioTrimestre(trimestre, anio));
  const hoy = aFechaUTC(fechaHoy());
  const dias = Math.round((hoy.getTime() - inicio.getTime()) / 86_400_000);
  return Math.min(10, Math.max(1, Math.floor(dias / 7) + 1));
}

/** Lunes canónico de una semana del trimestre. */
export function inicioSemana(trimestre: Trimestre, anio: number, semana: number) {
  return sumarDias(inicioTrimestre(trimestre, anio), (semana - 1) * 7);
}
