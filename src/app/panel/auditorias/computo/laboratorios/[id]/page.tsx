import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireModulo } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BadgeActivo } from "../../badge-activo";
import { BotonEliminar } from "../../boton-eliminar";
import { BotonEstado } from "../../boton-estado";
import { EditarComputadora } from "../../editar-computadora";
import { EditarLaboratorio } from "../../editar-laboratorio";
import { FormComputadora } from "../../form-computadora";

export const instant = false;

export const metadata = {
  title: "Detalle de laboratorio | Auditorías de cómputo",
};

export default async function LaboratorioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const perfil = await requireModulo("auditorias-computo");
  const { id } = await params;

  const supabase = createAdminClient();

  const [labRes, compsRes] = await Promise.all([
    supabase
      .from("labs_computo")
      .select("id, codigo, nombre, ubicacion, activo")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("computadoras")
      .select("id, laboratorio_id, codigo, nombre, orden, activo")
      .eq("laboratorio_id", id)
      .order("orden")
      .order("codigo"),
  ]);

  if (labRes.error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo cargar el laboratorio: {labRes.error.message}
      </p>
    );
  }

  if (!labRes.data) {
    notFound();
  }

  const lab = labRes.data;
  const computadoras = compsRes.data ?? [];
  const esChecklist = perfil.rol === "checklist";
  const activas = computadoras.filter((computadora) => computadora.activo).length;
  const siguienteOrden =
    computadoras.reduce(
      (maximo, computadora) => Math.max(maximo, computadora.orden),
      0
    ) + 1;

  return (
    <div className="space-y-6">
      <Link
        href="/panel/auditorias/computo?vista=laboratorios"
        className="inline-flex items-center gap-1 text-sm font-medium text-acento transition hover:text-superficie-azul"
      >
        ← Laboratorios
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Auditorías / Cómputo / Laboratorio
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-texto">
              {lab.nombre}
            </h1>
            <BadgeActivo activo={lab.activo} />
          </div>
          <p className="mt-1 text-sm text-tenue">
            {lab.codigo}
            {lab.ubicacion ? ` · ${lab.ubicacion}` : ""}
          </p>
        </div>

        {esChecklist && (
          <div className="flex flex-wrap items-start gap-2">
            <EditarLaboratorio laboratorio={lab} />
            <BotonEstado
              id={lab.id}
              activo={lab.activo}
              tipo="laboratorio"
            />
            <BotonEliminar
              id={lab.id}
              tipo="laboratorio"
              redirigirA="/panel/auditorias/computo?vista=laboratorios"
            />
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-borde bg-tarjeta p-4">
          <p className="etiqueta-tecnica text-[9px] text-tenue">Ubicación</p>
          <p className="mt-2 text-sm font-medium text-texto">
            {lab.ubicacion || "Sin ubicación"}
          </p>
        </div>

        <div className="rounded-xl border border-borde bg-tarjeta p-4">
          <p className="etiqueta-tecnica text-[9px] text-tenue">
            Computadoras
          </p>
          <p className="mt-2 text-2xl font-semibold text-texto">
            {computadoras.length}
          </p>
          <p className="text-xs text-tenue">{activas} activa(s)</p>
        </div>

        <Link
          href={`/panel/auditorias/computo?lab=${lab.id}`}
          className="rounded-xl border border-borde bg-tarjeta p-4 transition hover:border-acento hover:bg-superficie-clara"
        >
          <p className="etiqueta-tecnica text-[9px] text-tenue">Auditorías</p>
          <p className="mt-2 text-sm font-semibold text-acento">
            Ver semanas de este laboratorio →
          </p>
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-texto">
              Computadoras
            </h2>
            <p className="text-sm text-tenue">
              {esChecklist
                ? "Agrega, edita, activa o elimina los equipos de este laboratorio."
                : "Vista de solo lectura de los equipos registrados."}
            </p>
          </div>
          <span className="etiqueta-tecnica text-[9px] text-tenue">
            {computadoras.length} equipo(s)
          </span>
        </div>

        {compsRes.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar las computadoras: {compsRes.error.message}
          </p>
        )}

        {esChecklist && (
          <FormComputadora
            laboratorioId={lab.id}
            siguienteOrden={siguienteOrden}
          />
        )}

        {computadoras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-8 text-center">
            <p className="text-sm font-medium text-texto">
              Este laboratorio no tiene computadoras
            </p>
            <p className="mt-1 text-sm text-tenue">
              {esChecklist
                ? "Agrega la primera con el formulario de arriba."
                : "El rol Checklist debe registrarlas."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {computadoras.map((computadora) => (
                <article
                  key={computadora.id}
                  className="rounded-xl border border-borde bg-tarjeta p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-texto">
                        {computadora.codigo}
                      </p>
                      <p className="text-xs text-tenue">
                        {computadora.nombre || "Sin nombre"} · Orden{" "}
                        {computadora.orden}
                      </p>
                    </div>
                    <BadgeActivo activo={computadora.activo} />
                  </div>

                  {esChecklist && (
                    <div className="mt-3 flex flex-wrap items-start justify-end gap-2">
                      <EditarComputadora
                        computadora={{
                          id: computadora.id,
                          laboratorioId: lab.id,
                          codigo: computadora.codigo,
                          nombre: computadora.nombre,
                          orden: computadora.orden,
                        }}
                      />
                      <BotonEstado
                        id={computadora.id}
                        activo={computadora.activo}
                        tipo="computadora"
                      />
                      <BotonEliminar
                        id={computadora.id}
                        tipo="computadora"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-borde bg-tarjeta md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-superficie-clara etiqueta-tecnica text-[9px] text-tenue">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Código</th>
                      <th className="px-4 py-3 font-semibold">Nombre</th>
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
                    {computadoras.map((computadora) => (
                      <tr
                        key={computadora.id}
                        className="border-t border-borde transition-colors hover:bg-superficie-clara/60"
                      >
                        <td className="px-4 py-3 font-medium text-texto">
                          {computadora.codigo}
                        </td>
                        <td className="px-4 py-3 text-tenue">
                          {computadora.nombre || "—"}
                        </td>
                        <td className="px-4 py-3 text-tenue">
                          {computadora.orden}
                        </td>
                        <td className="px-4 py-3">
                          <BadgeActivo activo={computadora.activo} />
                        </td>
                        {esChecklist && (
                          <td className="px-4 py-3">
                            <div className="flex items-start justify-end gap-2">
                              <EditarComputadora
                                computadora={{
                                  id: computadora.id,
                                  laboratorioId: lab.id,
                                  codigo: computadora.codigo,
                                  nombre: computadora.nombre,
                                  orden: computadora.orden,
                                }}
                              />
                              <BotonEstado
                                id={computadora.id}
                                activo={computadora.activo}
                                tipo="computadora"
                              />
                              <BotonEliminar
                                id={computadora.id}
                                tipo="computadora"
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
