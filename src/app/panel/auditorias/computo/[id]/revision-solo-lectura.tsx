"use client";

import { BadgeRespuesta } from "../badge-respuesta";
import {
  useBusquedaComputadoras,
  type ComputadoraBuscable,
} from "../busqueda-computadoras";
import type { EstadoRespuesta } from "@/lib/computo";

export function RevisionSoloLectura({
  computadoras,
  items,
  equipos,
  respuestas,
  observaciones,
}: {
  computadoras: ComputadoraBuscable[];
  items: { id: string; nombre: string; categoria: string }[];
  equipos: {
    computadoraId: string;
    observacionHardware: string | null;
    observacionSoftware: string | null;
  }[];
  respuestas: {
    computadoraId: string;
    itemId: string;
    estado: string;
  }[];
  observaciones: string | null;
}) {
  const { coincide } = useBusquedaComputadoras();

  const itemsHardware = items.filter((item) => item.categoria === "Hardware");
  const itemsSoftware = items.filter((item) => item.categoria === "Software");

  const equipoPorComputadora = new Map(
    equipos.map((equipo) => [equipo.computadoraId, equipo])
  );

  const respuestaPorClave = new Map(
    respuestas.map((respuesta) => [
      `${respuesta.computadoraId}:${respuesta.itemId}`,
      respuesta.estado as EstadoRespuesta,
    ])
  );

  const visibles = computadoras.filter(coincide);

  return (
    <div className="space-y-4">
      {visibles.map((computadora) => {
        const equipo = equipoPorComputadora.get(computadora.id);

        return (
          <article
            key={computadora.id}
            className="overflow-hidden rounded-xl border border-borde bg-tarjeta"
          >
            <header className="flex items-center justify-between gap-3 border-b border-borde bg-superficie-clara/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-tarjeta text-[10px] font-semibold text-acento ring-1 ring-borde">
                  {computadora.codigo}
                </span>
                <div>
                  <p className="text-sm font-semibold text-texto">
                    {computadora.codigo}
                  </p>
                  {computadora.nombre && (
                    <p className="text-[11px] text-tenue">
                      {computadora.nombre}
                    </p>
                  )}
                </div>
              </div>
              <span className="etiqueta-tecnica text-[9px] text-tenue">
                Equipo
              </span>
            </header>

            <div className="grid gap-5 p-4 lg:grid-cols-2">
              <section>
                <p className="etiqueta-tecnica text-[9px] text-acento">
                  Hardware
                </p>
                <div className="mt-2 space-y-1.5">
                  {itemsHardware.map((item) => {
                    const estado =
                      respuestaPorClave.get(
                        `${computadora.id}:${item.id}`
                      ) ?? "pendiente";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-borde px-3 py-2"
                      >
                        <span className="text-sm text-texto">{item.nombre}</span>
                        <BadgeRespuesta estado={estado} />
                      </div>
                    );
                  })}
                  {itemsHardware.length === 0 && (
                    <p className="text-xs text-tenue">Sin ítems.</p>
                  )}
                </div>
                {equipo?.observacionHardware && (
                  <p className="mt-2 text-xs leading-5 text-tenue">
                    <span className="font-semibold text-texto">Observación:</span>{" "}
                    {equipo.observacionHardware}
                  </p>
                )}
              </section>

              <section>
                <p className="etiqueta-tecnica text-[9px] text-acento">
                  Software
                </p>
                <div className="mt-2 space-y-1.5">
                  {itemsSoftware.map((item) => {
                    const estado =
                      respuestaPorClave.get(
                        `${computadora.id}:${item.id}`
                      ) ?? "pendiente";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-borde px-3 py-2"
                      >
                        <span className="text-sm text-texto">{item.nombre}</span>
                        <BadgeRespuesta estado={estado} />
                      </div>
                    );
                  })}
                  {itemsSoftware.length === 0 && (
                    <p className="text-xs text-tenue">Sin ítems.</p>
                  )}
                </div>
                {equipo?.observacionSoftware && (
                  <p className="mt-2 text-xs leading-5 text-tenue">
                    <span className="font-semibold text-texto">Observación:</span>{" "}
                    {equipo.observacionSoftware}
                  </p>
                )}
              </section>
            </div>
          </article>
        );
      })}

      {computadoras.length === 0 && (
        <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-6 text-sm text-tenue">
          Este laboratorio no tiene computadoras registradas.
        </div>
      )}

      {computadoras.length > 0 && visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-6 text-sm text-tenue">
          No hay computadoras que coincidan con la búsqueda.
        </div>
      )}

      {observaciones && (
        <div className="rounded-xl border border-borde bg-tarjeta p-4">
          <p className="etiqueta-tecnica text-[9px] text-tenue">
            Observaciones de la semana
          </p>
          <p className="mt-1 text-sm leading-6 whitespace-pre-line text-texto">
            {observaciones}
          </p>
        </div>
      )}
    </div>
  );
}
