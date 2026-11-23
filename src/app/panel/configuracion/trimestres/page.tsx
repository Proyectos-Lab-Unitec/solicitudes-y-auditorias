import { connection } from "next/server";
import { requireModulo } from "@/lib/auth";
import {
  TRIMESTRES,
  anioActual,
  formatearFechaHora,
  inicioTrimestre,
  type Trimestre,
} from "@/lib/computo";
import { createAdminClient } from "@/lib/supabase/admin";
import { CrearAnio } from "./crear-anio";
import { FormTrimestre } from "./form-trimestre";

export const instant = false;

export const metadata = {
  title: "Configuración de trimestres | Gestión de Laboratorios",
};

type ConfigFila = {
  anio: number;
  trimestre: Trimestre;
  fecha_inicio: string;
  actualizado_en: string;
};

export default async function ConfiguracionTrimestresPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  await connection();
  await requireModulo("configuracion-trimestres");

  const params = await searchParams;
  const actual = anioActual();
  const anioSolicitado = Number.parseInt(params.anio ?? "", 10);
  const anio =
    Number.isInteger(anioSolicitado) &&
    anioSolicitado >= 2000 &&
    anioSolicitado <= 2100
      ? anioSolicitado
      : actual;

  const supabase = createAdminClient();

  const [configRes, auditoriasRes, perfilesRes] = await Promise.all([
    supabase
      .from("trimestres_config")
      .select(
        "anio, trimestre, fecha_inicio, actualizado_por, actualizado_en"
      )
      .order("anio", { ascending: false })
      .order("trimestre"),
    supabase.from("auditorias_computo").select("anio, trimestre"),
    supabase.from("perfiles").select("id, nombre"),
  ]);

  const errorCarga =
    configRes.error?.message ??
    auditoriasRes.error?.message ??
    perfilesRes.error?.message ??
    "";

  const configs = (configRes.data ?? []) as Array<
    ConfigFila & { actualizado_por: string | null }
  >;
  const auditorias = (auditoriasRes.data ?? []) as Array<{
    anio: number;
    trimestre: string;
  }>;
  const perfiles = (perfilesRes.data ?? []) as Array<{
    id: string;
    nombre: string;
  }>;

  const perfilesPorId = new Map(
    perfiles.map((perfil) => [perfil.id, perfil.nombre])
  );

  const configPorTrimestre = new Map(
    configs
      .filter((config) => config.anio === anio)
      .map((config) => [config.trimestre, config])
  );

  const conteoAuditorias = new Map<string, number>();
  for (const auditoria of auditorias) {
    const clave = `${auditoria.anio}:${auditoria.trimestre}`;
    conteoAuditorias.set(clave, (conteoAuditorias.get(clave) ?? 0) + 1);
  }

  const filas = TRIMESTRES.map((trimestre) => {
    const config = configPorTrimestre.get(trimestre);
    const auditoriasRegistradas =
      conteoAuditorias.get(`${anio}:${trimestre}`) ?? 0;

    return {
      trimestre,
      fechaInicio: config?.fecha_inicio ?? inicioTrimestre(trimestre, anio),
      configurado: Boolean(config),
      auditorias: auditoriasRegistradas,
      actualizadoEn: config?.actualizado_en ?? null,
      actualizadoPor: config?.actualizado_por
        ? (perfilesPorId.get(config.actualizado_por) ?? null)
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Configuración / Trimestres
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-texto">
            Trimestres por año
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-tenue">
            Define el lunes de la semana 1 de cada trimestre. Las 10 semanas se
            calculan desde esa fecha y, al guardar, se recolocan las auditorías
            ya registradas de ese año y trimestre.
          </p>
        </div>

        <form
          method="get"
          action="/panel/configuracion/trimestres"
          className="flex items-end gap-2 rounded-lg border border-borde bg-tarjeta p-2"
        >
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.08em] uppercase text-tenue">
              Año
            </span>
            <input
              type="number"
              name="anio"
              min={2000}
              max={2100}
              defaultValue={anio}
              aria-label="Año a configurar"
              className="w-28 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-borde bg-superficie-clara px-3 py-2 text-sm font-semibold text-texto transition hover:border-acento hover:bg-white"
          >
            Ver
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borde bg-tarjeta px-4 py-3">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-tenue">
            Año seleccionado
          </p>
          <p className="mt-0.5 text-lg font-semibold text-texto">{anio}</p>
          <p className="text-xs text-tenue">
            Cada trimestre genera automáticamente 10 semanas desde su lunes.
          </p>
        </div>
        <CrearAnio anio={anio} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Cambiar una fecha mueve las semanas guardadas</p>
        <p className="mt-1 text-amber-800">
          Si el trimestre ya tiene auditorías, la fecha de cada semana se
          recalcula desde el nuevo lunes de la semana 1. No se borran respuestas,
          observaciones ni el estado de las revisiones.
        </p>
      </div>

      {errorCarga && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar la configuración: {errorCarga}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filas.map((fila) => (
          <FormTrimestre
            key={fila.trimestre}
            anio={anio}
            trimestre={fila.trimestre}
            fechaInicio={fila.fechaInicio}
            configurado={fila.configurado}
            auditorias={fila.auditorias}
            actualizadoEn={
              fila.actualizadoEn ? formatearFechaHora(fila.actualizadoEn) : null
            }
            actualizadoPor={fila.actualizadoPor}
          />
        ))}
      </div>
    </div>
  );
}
