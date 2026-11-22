import Link from "next/link";
import { connection } from "next/server";
import { requireModulo } from "@/lib/auth";
import {
  CLASE_AUDITORIA,
  ETIQUETA_AUDITORIA,
  TRIMESTRES,
  anioActual,
  formatearSemana,
  inicioTrimestre,
  sumarDias,
  type EstadoAuditoria,
  type Trimestre,
} from "@/lib/computo";
import { createAdminClient } from "@/lib/supabase/admin";
import { AsistenteSemana } from "./asistente-semana";
import { BadgeActivo } from "./badge-activo";
import { BotonEliminar } from "./boton-eliminar";
import { BotonEstado } from "./boton-estado";
import { DescargaExcelComputo } from "./descarga-excel-computo";
import { EditarItem } from "./editar-item";
import { FormItem } from "./form-item";
import { FormLaboratorio } from "./form-laboratorio";

export const instant = false;

export const metadata = {
  title: "Auditorías de cómputo | Gestión de Laboratorios",
};

type Vista = "auditorias" | "laboratorios" | "items";

function BadgeEstadoAuditoria({ estado }: { estado: EstadoAuditoria }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${CLASE_AUDITORIA[estado]}`}
    >
      {ETIQUETA_AUDITORIA[estado]}
    </span>
  );
}

function BarraAvance({
  respondidas,
  total,
  problemas,
}: {
  respondidas: number;
  total: number;
  problemas: number;
}) {
  if (total === 0) {
    return <span className="text-xs text-tenue">Sin ítems activos</span>;
  }

  const porcentaje = Math.round((respondidas / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-superficie-clara">
        <div
          className="h-full rounded-full bg-acento"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="etiqueta-tecnica text-[9px] text-tenue">
        {respondidas}/{total}
      </span>
      {problemas > 0 && (
        <span className="text-[11px] text-red-600">· {problemas} problema(s)</span>
      )}
    </div>
  );
}

export default async function AuditoriasComputoPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    lab?: string;
    trimestre?: string;
    error?: string;
  }>;
}) {
  await connection();
  const perfil = await requireModulo("auditorias-computo");
  const params = await searchParams;

  const vista: Vista =
    params.vista === "laboratorios" || params.vista === "items"
      ? params.vista
      : params.vista === "computadoras"
        ? "laboratorios"
        : "auditorias";

  const esChecklist = perfil.rol === "checklist";
  const anio = anioActual();

  const supabase = createAdminClient();

  const [
    labsRes,
    compsRes,
    itemsRes,
    auditoriasRes,
    perfilesRes,
    respuestasRes,
  ] = await Promise.all([
    supabase
      .from("labs_computo")
      .select("id, codigo, nombre, ubicacion, activo")
      .order("nombre"),
    supabase
      .from("computadoras")
      .select("id, laboratorio_id, codigo, nombre, orden, activo")
      .order("orden")
      .order("codigo"),
    supabase
      .from("checklist_items")
      .select("id, nombre, categoria, orden, activo")
      .order("categoria")
      .order("orden"),
    supabase
      .from("auditorias_computo")
      .select(
        "id, laboratorio_id, anio, semana_inicio, trimestre, numero_semana, estado, auditor_id, observaciones, completado_en, creado_en, problemas"
      )
      .order("semana_inicio", { ascending: false }),
    supabase.from("perfiles").select("id, nombre"),
    supabase
      .from("auditoria_computo_respuestas")
      .select("auditoria_id, computadora_id, item_id, estado"),
  ]);

  const errorCarga =
    labsRes.error?.message ??
    compsRes.error?.message ??
    itemsRes.error?.message ??
    auditoriasRes.error?.message ??
    perfilesRes.error?.message ??
    respuestasRes.error?.message ??
    "";

  const labs = (labsRes.data ?? []) as Array<{
    id: string;
    codigo: string;
    nombre: string;
    ubicacion: string | null;
    activo: boolean;
  }>;
  const computadoras = (compsRes.data ?? []) as Array<{
    id: string;
    laboratorio_id: string;
    codigo: string;
    nombre: string | null;
    orden: number;
    activo: boolean;
  }>;
  const items = (itemsRes.data ?? []) as Array<{
    id: string;
    nombre: string;
    categoria: string;
    orden: number;
    activo: boolean;
  }>;
  const auditorias = (auditoriasRes.data ?? []) as Array<{
    id: string;
    laboratorio_id: string;
    anio: number;
    semana_inicio: string;
    trimestre: string;
    numero_semana: number;
    estado: EstadoAuditoria;
    auditor_id: string | null;
    observaciones: string | null;
    completado_en: string | null;
    problemas: number;
  }>;
  const perfiles = (perfilesRes.data ?? []) as Array<{
    id: string;
    nombre: string;
  }>;
  const respuestas = (respuestasRes.data ?? []) as Array<{
    auditoria_id: string;
    computadora_id: string;
    item_id: string;
    estado: string;
  }>;

  const labsPorId = new Map(labs.map((lab) => [lab.id, lab]));
  const perfilesPorId = new Map(perfiles.map((p) => [p.id, p.nombre]));

  const computadorasPorLab = new Map<string, number>();
  const computadorasActivasPorLab = new Map<string, number>();

  for (const computadora of computadoras) {
    computadorasPorLab.set(
      computadora.laboratorio_id,
      (computadorasPorLab.get(computadora.laboratorio_id) ?? 0) + 1
    );

    if (computadora.activo) {
      computadorasActivasPorLab.set(
        computadora.laboratorio_id,
        (computadorasActivasPorLab.get(computadora.laboratorio_id) ?? 0) + 1
      );
    }
  }

  const itemsActivos = items.filter((item) => item.activo).length;

  const progresoPorAuditoria = new Map<string, number>();

  for (const respuesta of respuestas) {
    if (respuesta.estado === "ok") {
      progresoPorAuditoria.set(
        respuesta.auditoria_id,
        (progresoPorAuditoria.get(respuesta.auditoria_id) ?? 0) + 1
      );
    }
  }

  const auditoriasConResumen = auditorias.map((auditoria) => {
    const lab = labsPorId.get(auditoria.laboratorio_id);
    const computadorasActivas =
      computadorasActivasPorLab.get(auditoria.laboratorio_id) ?? 0;
    const total = computadorasActivas * itemsActivos;
    const respondidas = progresoPorAuditoria.get(auditoria.id) ?? 0;

    return {
      ...auditoria,
      lab,
      respondidas,
      total,
      problemas:
        auditoria.estado === "completada"
          ? (auditoria.problemas ?? 0)
          : Math.max(0, total - respondidas),
    };
  });

  const resumenPorId = new Map(
    auditoriasConResumen.map((auditoria) => [auditoria.id, auditoria])
  );

  // Asistente: laboratorio → trimestre → semana.
  const labWizard = labs.find((lab) => lab.id === params.lab) ?? null;
  const trimestreWizard: Trimestre | null =
    TRIMESTRES.find((trimestre) => trimestre === params.trimestre) ?? null;

  let semanasWizard: Array<{
    numero: number;
    inicio: string;
    auditoria: {
      id: string;
      estado: EstadoAuditoria;
    } | null;
  }> = [];

  if (labWizard && trimestreWizard) {
    const propias = auditorias.filter(
      (auditoria) =>
        auditoria.laboratorio_id === labWizard.id &&
        auditoria.trimestre === trimestreWizard
    );

    const ancla = propias.find(
      (auditoria) => auditoria.anio === anio && auditoria.numero_semana === 1
    );
    const inicio =
      ancla?.semana_inicio ?? inicioTrimestre(trimestreWizard, anio);

    semanasWizard = Array.from({ length: 10 }, (_, indice) => {
      const numero = indice + 1;
      const auditoria = propias.find(
        (semana) => semana.anio === anio && semana.numero_semana === numero
      );
      const resumen = auditoria ? resumenPorId.get(auditoria.id) : undefined;

      return {
        numero,
        inicio: sumarDias(inicio, indice * 7),
        auditoria: resumen
          ? {
              id: resumen.id,
              estado: resumen.estado,
            }
          : null,
      };
    });
  }

  const computadorasActivasWizard = labWizard
    ? (computadorasActivasPorLab.get(labWizard.id) ?? 0)
    : 0;

  const tabs: Array<{ id: Vista; label: string; count: number }> = [
    { id: "auditorias", label: "Auditorías", count: auditorias.length },
    { id: "laboratorios", label: "Laboratorios", count: labs.length },
    { id: "items", label: "Ítems", count: items.length },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Auditorías / Cómputo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-texto">
            Auditorías de cómputo
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-tenue">
            Una revisión semanal por laboratorio, con una sola lista para todas
            las computadoras.{" "}
            {esChecklist
              ? "Elige el laboratorio, el trimestre y la semana para registrar la revisión."
              : "Vista de solo lectura: consulta las semanas por laboratorio y trimestre."}
          </p>
        </div>
        {!esChecklist && (
          <span className="etiqueta-tecnica rounded-md border border-borde bg-superficie-clara px-2 py-1 text-[9px] text-tenue">
            Solo lectura
          </span>
        )}
      </section>

      <nav className="inline-flex flex-wrap gap-1 rounded-lg border border-borde bg-tarjeta p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/panel/auditorias/computo?vista=${tab.id}`}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
              vista === tab.id
                ? "bg-superficie-azul text-white"
                : "text-tenue hover:bg-superficie-clara hover:text-texto"
            }`}
          >
            {tab.label}
            <span
              className={`etiqueta-tecnica text-[9px] ${
                vista === tab.id ? "text-acento-claro" : "text-tenue"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </nav>

      {errorCarga && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los datos: {errorCarga}
        </p>
      )}

      {vista === "auditorias" && (
        <div className="space-y-6">
          <AsistenteSemana
            laboratorios={labs}
            labId={labWizard?.id ?? ""}
            trimestre={trimestreWizard}
            anio={anio}
            semanas={semanasWizard}
            esChecklist={esChecklist}
            computadorasActivas={computadorasActivasWizard}
            itemsActivos={itemsActivos}
            error={params.error}
          />

          <DescargaExcelComputo
            anio={anio}
            laboratorios={labs}
            auditorias={auditoriasConResumen}
          />

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-texto">
                Semanas registradas
              </h2>
              <span className="etiqueta-tecnica text-[9px] text-tenue">
                {auditoriasConResumen.length} semana(s)
              </span>
            </div>

            <div className="space-y-3 md:hidden">
              {auditoriasConResumen.map((auditoria) => (
                <Link
                  key={auditoria.id}
                  href={`/panel/auditorias/computo/${auditoria.id}`}
                  className="block rounded-xl border border-borde bg-tarjeta p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="etiqueta-tecnica text-[9px] text-acento">
                        {auditoria.trimestre} {auditoria.anio} · Semana{" "}
                        {auditoria.numero_semana}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-texto">
                        {auditoria.lab?.nombre ?? "—"}
                      </p>
                      <p className="text-xs text-tenue">
                        {formatearSemana(auditoria.semana_inicio)}
                      </p>
                    </div>
                    <BadgeEstadoAuditoria estado={auditoria.estado} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <BarraAvance
                      respondidas={auditoria.respondidas}
                      total={auditoria.total}
                      problemas={auditoria.problemas}
                    />
                  </div>
                </Link>
              ))}

              {auditoriasConResumen.length === 0 && (
                <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-8 text-center">
                  <p className="text-sm font-medium text-texto">
                    Todavía no hay semanas registradas
                  </p>
                  <p className="mt-1 text-sm text-tenue">
                    Elige un laboratorio, un trimestre y una semana arriba.
                  </p>
                </div>
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-borde bg-tarjeta md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-superficie-clara etiqueta-tecnica text-[9px] text-tenue">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Semana</th>
                      <th className="px-4 py-3 font-semibold">Laboratorio</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Auditor</th>
                      <th className="px-4 py-3 font-semibold">Avance</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoriasConResumen.map((auditoria) => (
                      <tr
                        key={auditoria.id}
                        className="border-t border-borde transition-colors hover:bg-superficie-clara/60"
                      >
                        <td className="px-4 py-3">
                          <p className="etiqueta-tecnica text-[9px] text-acento">
                            {auditoria.trimestre} {auditoria.anio} · Semana{" "}
                            {auditoria.numero_semana}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-texto">
                            {formatearSemana(auditoria.semana_inicio)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-texto">
                            {auditoria.lab?.nombre ?? "—"}
                          </p>
                          <p className="etiqueta-tecnica text-[9px] text-tenue">
                            {auditoria.lab?.codigo ?? ""}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <BadgeEstadoAuditoria estado={auditoria.estado} />
                        </td>
                        <td className="px-4 py-3 text-tenue">
                          {auditoria.auditor_id
                            ? (perfilesPorId.get(auditoria.auditor_id) ?? "—")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <BarraAvance
                            respondidas={auditoria.respondidas}
                            total={auditoria.total}
                            problemas={auditoria.problemas}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/panel/auditorias/computo/${auditoria.id}`}
                            className="text-sm font-semibold text-acento transition hover:text-superficie-azul"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {auditoriasConResumen.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <p className="text-sm font-medium text-texto">
                            Todavía no hay semanas registradas
                          </p>
                          <p className="mt-1 text-sm text-tenue">
                            {esChecklist
                              ? "Elige un laboratorio, un trimestre y una semana arriba."
                              : "Cuando el rol Checklist registre una, aparecerá aquí."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {vista === "laboratorios" && (
        <div className="space-y-4">
          {esChecklist && <FormLaboratorio />}

          <div className="overflow-hidden rounded-xl border border-borde bg-tarjeta">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-superficie-clara etiqueta-tecnica text-[9px] text-tenue">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Código</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold">Ubicación</th>
                    <th className="px-4 py-3 font-semibold">Computadoras</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map((lab) => (
                    <tr
                      key={lab.id}
                      className="border-t border-borde transition-colors hover:bg-superficie-clara/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/panel/auditorias/computo/laboratorios/${lab.id}`}
                          className="font-medium text-acento transition hover:text-superficie-azul"
                        >
                          {lab.codigo}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-texto">{lab.nombre}</td>
                      <td className="px-4 py-3 text-tenue">
                        {lab.ubicacion || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="etiqueta-tecnica text-[9px] text-tenue">
                          {computadorasPorLab.get(lab.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <BadgeActivo activo={lab.activo} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/panel/auditorias/computo/laboratorios/${lab.id}`}
                          className="text-sm font-semibold text-acento transition hover:text-superficie-azul"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {labs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center"
                      >
                        <p className="text-sm font-medium text-texto">
                          No hay laboratorios registrados
                        </p>
                        <p className="mt-1 text-sm text-tenue">
                          {esChecklist
                            ? "Agrega el primero con el formulario de arriba."
                            : "El rol Checklist debe registrarlos."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {vista === "items" && (
        <div className="space-y-4">
          {esChecklist && <FormItem />}

          <div className="overflow-hidden rounded-xl border border-borde bg-tarjeta">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-superficie-clara etiqueta-tecnica text-[9px] text-tenue">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ítem</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Orden</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    {esChecklist && (
                      <th className="px-4 py-3 text-right font-semibold">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-borde transition-colors hover:bg-superficie-clara/60"
                    >
                      <td className="px-4 py-3 font-medium text-texto">
                        {item.nombre}
                      </td>
                      <td className="px-4 py-3 text-tenue">
                        {item.categoria}
                      </td>
                      <td className="px-4 py-3 text-tenue">{item.orden}</td>
                      <td className="px-4 py-3">
                        <BadgeActivo activo={item.activo} />
                      </td>
                      {esChecklist && (
                        <td className="px-4 py-3">
                          <div className="flex items-start justify-end gap-2">
                            <EditarItem
                              item={{
                                id: item.id,
                                nombre: item.nombre,
                                categoria: item.categoria,
                                orden: item.orden,
                              }}
                            />
                            <BotonEstado
                              id={item.id}
                              activo={item.activo}
                              tipo="item"
                            />
                            <BotonEliminar id={item.id} tipo="item" />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={esChecklist ? 5 : 4}
                        className="px-4 py-12 text-center"
                      >
                        <p className="text-sm font-medium text-texto">
                          No hay ítems registrados
                        </p>
                        <p className="mt-1 text-sm text-tenue">
                          {esChecklist
                            ? "Agrega el primero con el formulario de arriba."
                            : "El rol Checklist debe registrarlos."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
