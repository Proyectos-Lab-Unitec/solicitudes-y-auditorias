import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireModulo } from "@/lib/auth";
import {
  CLASE_AUDITORIA,
  ETIQUETA_AUDITORIA,
  formatearFechaHora,
  formatearSemana,
  type EstadoAuditoria,
} from "@/lib/computo";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BuscadorComputadoras,
  ProveedorBusquedaComputadoras,
} from "../busqueda-computadoras";
import { FormularioSemana } from "../formulario-semana";
import { RevisionSoloLectura } from "./revision-solo-lectura";
import { ReabrirSemana } from "./reabrir-semana";

export const instant = false;

export const metadata = {
  title: "Detalle de auditoría | Gestión de Laboratorios",
};

function BadgeEstado({ estado }: { estado: EstadoAuditoria }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${CLASE_AUDITORIA[estado]}`}
    >
      {ETIQUETA_AUDITORIA[estado]}
    </span>
  );
}

export default async function AuditoriaComputoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lab?: string; trimestre?: string }>;
}) {
  await connection();
  const perfil = await requireModulo("auditorias-computo");
  const { id } = await params;
  const query = await searchParams;

  const supabase = createAdminClient();

  const { data: auditoria } = await supabase
    .from("auditorias_computo")
    .select(
      "id, laboratorio_id, anio, semana_inicio, trimestre, numero_semana, estado, auditor_id, observaciones, completado_en, problemas"
    )
    .eq("id", id)
    .maybeSingle();

  if (!auditoria) {
    notFound();
  }

  const [
    { data: laboratorio },
    { data: auditor },
    { data: computadoras },
    { data: items },
    { data: equipos },
    { data: respuestas },
  ] = await Promise.all([
    supabase
      .from("labs_computo")
      .select("codigo, nombre")
      .eq("id", auditoria.laboratorio_id)
      .maybeSingle(),
    auditoria.auditor_id
      ? supabase
          .from("perfiles")
          .select("nombre")
          .eq("id", auditoria.auditor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("computadoras")
      .select("id, codigo, nombre, orden, activo")
      .eq("laboratorio_id", auditoria.laboratorio_id)
      .order("orden")
      .order("codigo"),
    supabase
      .from("checklist_items")
      .select("id, nombre, categoria, orden, activo")
      .order("categoria")
      .order("orden"),
    supabase
      .from("auditoria_computo_equipos")
      .select("computadora_id, observacion_hardware, observacion_software")
      .eq("auditoria_id", id),
    supabase
      .from("auditoria_computo_respuestas")
      .select("computadora_id, item_id, estado")
      .eq("auditoria_id", id),
  ]);

  const equiposLista = (equipos ?? []) as Array<{
    computadora_id: string;
    observacion_hardware: string | null;
    observacion_software: string | null;
  }>;
  const respuestasLista = (respuestas ?? []) as Array<{
    computadora_id: string;
    item_id: string;
    estado: string;
  }>;

  const computadorasConDatos = new Set([
    ...equiposLista.map((equipo) => equipo.computadora_id),
    ...respuestasLista.map((respuesta) => respuesta.computadora_id),
  ]);

  const itemsConDatos = new Set(
    respuestasLista.map((respuesta) => respuesta.item_id)
  );

  const computadorasVisibles = ((computadoras ?? []) as Array<{
    id: string;
    codigo: string;
    nombre: string | null;
    activo: boolean;
  }>).filter((computadora) => {
    if (computadorasConDatos.has(computadora.id)) return true;
    if (auditoria.estado === "completada") return false;
    return computadora.activo;
  });

  const itemsVisibles = ((items ?? []) as Array<{
    id: string;
    nombre: string;
    categoria: string;
    activo: boolean;
  }>).filter((item) => {
    if (itemsConDatos.has(item.id)) return true;
    if (auditoria.estado === "completada") return false;
    return item.activo;
  });

  const computadorasParaBusqueda = computadorasVisibles.map((computadora) => ({
    id: computadora.id,
    codigo: computadora.codigo,
    nombre: computadora.nombre,
  }));

  const computadorasActivas = ((computadoras ?? []) as Array<{
    activo: boolean;
  }>).filter((computadora) => computadora.activo).length;

  const itemsActivos = ((items ?? []) as Array<{ activo: boolean }>).filter(
    (item) => item.activo
  ).length;

  const esperado = computadorasActivas * itemsActivos;
  const respondidas = respuestasLista.filter(
    (respuesta) => respuesta.estado === "ok"
  ).length;
  const problemas =
    auditoria.estado === "completada"
      ? (auditoria.problemas ?? 0)
      : Math.max(0, esperado - respondidas);

  const esChecklist = perfil.rol === "checklist";
  const editable = esChecklist && auditoria.estado === "borrador";

  const paramsVolver = new URLSearchParams({ vista: "auditorias" });
  if (query.lab) paramsVolver.set("lab", query.lab);
  if (query.trimestre) paramsVolver.set("trimestre", query.trimestre);

  return (
    <div className="space-y-6">
      <Link
        href={`/panel/auditorias/computo?${paramsVolver.toString()}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-acento transition hover:text-superficie-azul"
      >
        ← Volver a auditorías
      </Link>

      <section className="rounded-xl border border-borde bg-tarjeta p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="etiqueta-tecnica text-[9px] text-acento">
              {auditoria.trimestre} {auditoria.anio} · Semana{" "}
              {auditoria.numero_semana} · Auditoría de cómputo
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-texto">
              {laboratorio?.nombre ?? "Laboratorio"}
            </h1>
            <p className="mt-1 text-sm text-tenue">
              {laboratorio?.codigo ?? "—"} ·{" "}
              {formatearSemana(auditoria.semana_inicio)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BadgeEstado estado={auditoria.estado} />
            {!esChecklist && (
              <span className="etiqueta-tecnica rounded-md border border-borde bg-superficie-clara px-2 py-1 text-[9px] text-tenue">
                Solo lectura
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 sm:gap-3">
          <div className="rounded-lg bg-superficie-clara px-3 py-2">
            <p className="etiqueta-tecnica text-[9px] text-tenue">Auditor</p>
            <p className="mt-0.5 font-medium text-texto">
              {auditor?.nombre ?? "—"}
            </p>
          </div>
          <div className="rounded-lg bg-superficie-clara px-3 py-2">
            <p className="etiqueta-tecnica text-[9px] text-tenue">Ítems</p>
            <p className="mt-0.5 font-medium text-texto">
              {itemsActivos} activos
            </p>
          </div>
          <div className="rounded-lg bg-superficie-clara px-3 py-2">
            <p className="etiqueta-tecnica text-[9px] text-tenue">Avance</p>
            <p className="mt-0.5 font-medium text-texto">
              {respondidas}/{esperado}
              {problemas > 0 && (
                <span className="ml-2 text-red-600">
                  · {problemas} problema(s)
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-superficie-clara px-3 py-2">
            <p className="etiqueta-tecnica text-[9px] text-tenue">
              Computadoras
            </p>
            <p className="mt-0.5 font-medium text-texto">
              {computadorasActivas} activas
            </p>
          </div>
        </div>

        {auditoria.estado === "completada" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-100 bg-green-50/60 px-3 py-2.5">
            <p className="text-sm text-green-900">
              <span className="etiqueta-tecnica text-[9px] text-green-700">
                Completado en:{" "}
              </span>
              <span className="font-medium">
                {formatearFechaHora(auditoria.completado_en)}
              </span>
            </p>
            {esChecklist && <ReabrirSemana auditoriaId={auditoria.id} />}
          </div>
        )}
      </section>

      <ProveedorBusquedaComputadoras computadoras={computadorasParaBusqueda}>
        <BuscadorComputadoras />

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-texto">
            Revisión de la semana
          </h2>
          
        </div>

        {editable ? (
          <FormularioSemana
            auditoriaId={auditoria.id}
            computadoras={computadorasParaBusqueda}
            items={itemsVisibles.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              categoria: item.categoria,
            }))}
            equipos={equiposLista.map((equipo) => ({
              computadoraId: equipo.computadora_id,
              observacionHardware: equipo.observacion_hardware,
              observacionSoftware: equipo.observacion_software,
            }))}
            respuestas={respuestasLista.map((respuesta) => ({
              computadoraId: respuesta.computadora_id,
              itemId: respuesta.item_id,
              estado: respuesta.estado,
            }))}
            observaciones={auditoria.observaciones}
          />
        ) : (
          <RevisionSoloLectura
            computadoras={computadorasParaBusqueda}
            items={itemsVisibles.map((item) => ({
              id: item.id,
              nombre: item.nombre,
              categoria: item.categoria,
            }))}
            equipos={equiposLista.map((equipo) => ({
              computadoraId: equipo.computadora_id,
              observacionHardware: equipo.observacion_hardware,
              observacionSoftware: equipo.observacion_software,
            }))}
            respuestas={respuestasLista.map((respuesta) => ({
              computadoraId: respuesta.computadora_id,
              itemId: respuesta.item_id,
              estado: respuesta.estado,
            }))}
            observaciones={auditoria.observaciones}
          />
        )}
      </ProveedorBusquedaComputadoras>
    </div>
  );
}
