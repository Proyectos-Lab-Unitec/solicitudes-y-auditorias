"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle } from "react-icons/fi";
import { ModalConfirmacion } from "@/components/modal-confirmacion";
import type { EstadoAccion } from "@/lib/types";
import { completarSemana, guardarSemana } from "./actions";
import { useBusquedaComputadoras } from "./busqueda-computadoras";

const CLASE_CHECKBOX =
  "size-4 rounded border-borde text-superficie-azul accent-superficie-azul focus:ring-2 focus:ring-superficie-azul/30 disabled:opacity-60";

export function FormularioSemana({
  auditoriaId,
  computadoras,
  items,
  equipos,
  respuestas,
  observaciones,
}: {
  auditoriaId: string;
  computadoras: { id: string; codigo: string; nombre: string | null }[];
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
  const router = useRouter();
  const { coincide: coincideBusqueda } = useBusquedaComputadoras();
  const formRef = useRef<HTMLFormElement>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const totalItems = computadoras.length * items.length;
  const [marcados, setMarcados] = useState(
    respuestas.filter(
      (respuesta) =>
        respuesta.estado === "ok" &&
        computadoras.some((c) => c.id === respuesta.computadoraId) &&
        items.some((i) => i.id === respuesta.itemId)
    ).length
  );

  const itemsHardware = items.filter((item) => item.categoria === "Hardware");
  const itemsSoftware = items.filter((item) => item.categoria === "Software");

  const equipoPorComputadora = new Map(
    equipos.map((equipo) => [equipo.computadoraId, equipo])
  );

  const respuestaPorClave = new Map(
    respuestas.map((respuesta) => [
      `${respuesta.computadoraId}:${respuesta.itemId}`,
      respuesta.estado,
    ])
  );

  async function guardar(completar: boolean) {
    const form = formRef.current;
    if (!form || guardando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    const formData = new FormData(form);

    const equiposRevision = computadoras.map((computadora) => ({
      computadoraId: computadora.id,
      observacionHardware: String(formData.get(`hw-${computadora.id}`) ?? ""),
      observacionSoftware: String(formData.get(`sw-${computadora.id}`) ?? ""),
    }));

    const respuestasRevision = computadoras.flatMap((computadora) =>
      items.map((item) => ({
        computadoraId: computadora.id,
        itemId: item.id,
        estado: formData.get(`ok-${computadora.id}-${item.id}`)
          ? "ok"
          : "pendiente",
      }))
    );

    const observacionesRevision = String(formData.get("observaciones") ?? "");

    try {
      const resultado: EstadoAccion = completar
        ? await completarSemana(
            auditoriaId,
            equiposRevision,
            respuestasRevision,
            observacionesRevision
          )
        : await guardarSemana(
            auditoriaId,
            equiposRevision,
            respuestasRevision,
            observacionesRevision
          );

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudieron guardar los cambios.");
        return;
      }

      setMensaje(resultado.mensaje ?? "Cambios guardados.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  function actualizarContador(form: HTMLFormElement) {
    const casillas = form.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][name^="ok-"]'
    );
    setMarcados([...casillas].filter((casilla) => casilla.checked).length);
  }

  function marcarTodoBien(computadoraId: string) {
    const form = formRef.current;
    if (!form) return;

    form
      .querySelectorAll<HTMLInputElement>(
        `input[type="checkbox"][name^="ok-${computadoraId}-"]`
      )
      .forEach((checkbox) => {
        checkbox.checked = true;
      });

    actualizarContador(form);
    setMensaje("Computadora marcada como OK. Guarda para conservarla.");
    setError("");
  }

  function marcarTodaLaSemana() {
    const form = formRef.current;
    if (!form) return;

    form
      .querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"][name^="ok-"]'
      )
      .forEach((checkbox) => {
        checkbox.checked = true;
      });

    actualizarContador(form);
    setMensaje(
      `Toda la semana marcada como OK (${totalItems} ítem(s)). Guarda o completa la semana para conservarlo.`
    );
    setError("");
  }

  if (computadoras.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-6 text-sm text-tenue">
        Este laboratorio no tiene computadoras activas. Agrégalas desde el
        detalle del laboratorio.
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        void guardar(false);
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-green-900">
            Marcar toda la semana
          </p>
          <p className="mt-0.5 text-xs text-green-700">
            {marcados}/{totalItems} ítem(s) OK ·{" "}
            {computadoras.length} computadora(s)
          </p>
        </div>
        <button
          type="button"
          onClick={marcarTodaLaSemana}
          disabled={guardando || totalItems === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-white px-3.5 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiCheckCircle className="size-4" />
          Todo bien en toda la semana
        </button>
      </div>

      {computadoras.map((computadora) => {
        const equipo = equipoPorComputadora.get(computadora.id);

        return (
          <article
            key={computadora.id}
            hidden={!coincideBusqueda(computadora)}
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
              <button
                type="button"
                onClick={() => marcarTodoBien(computadora.id)}
                disabled={guardando}
                className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
              >
                Todo bien
              </button>
            </header>

            <div className="grid gap-5 p-4 lg:grid-cols-2">
              <section>
                <p className="etiqueta-tecnica text-[9px] text-acento">
                  Hardware
                </p>
                <div className="mt-2 space-y-2">
                  {itemsHardware.map((item) => {
                    const marcado =
                      respuestaPorClave.get(
                        `${computadora.id}:${item.id}`
                      ) === "ok";

                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-borde px-3 py-2 transition hover:bg-superficie-clara/60"
                      >
                        <span className="text-sm text-texto">{item.nombre}</span>
                        <input
                          type="checkbox"
                          name={`ok-${computadora.id}-${item.id}`}
                          defaultChecked={marcado}
                          disabled={guardando}
                          onChange={() => {
                            if (formRef.current) {
                              actualizarContador(formRef.current);
                            }
                          }}
                          className={CLASE_CHECKBOX}
                          aria-label={`${item.nombre} OK`}
                        />
                      </label>
                    );
                  })}
                  {itemsHardware.length === 0 && (
                    <p className="text-xs text-tenue">
                      No hay ítems de hardware activos.
                    </p>
                  )}
                </div>
                <label className="mt-3 block">
                  <span className="etiqueta-tecnica text-[9px] text-tenue">
                    Observación hardware
                  </span>
                  <input
                    name={`hw-${computadora.id}`}
                    type="text"
                    defaultValue={equipo?.observacionHardware ?? ""}
                    placeholder="Observación de la semana"
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
                  />
                </label>
              </section>

              <section>
                <p className="etiqueta-tecnica text-[9px] text-acento">
                  Software
                </p>
                <div className="mt-2 space-y-2">
                  {itemsSoftware.map((item) => {
                    const marcado =
                      respuestaPorClave.get(
                        `${computadora.id}:${item.id}`
                      ) === "ok";

                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-borde px-3 py-2 transition hover:bg-superficie-clara/60"
                      >
                        <span className="text-sm text-texto">{item.nombre}</span>
                        <input
                          type="checkbox"
                          name={`ok-${computadora.id}-${item.id}`}
                          defaultChecked={marcado}
                          disabled={guardando}
                          onChange={() => {
                            if (formRef.current) {
                              actualizarContador(formRef.current);
                            }
                          }}
                          className={CLASE_CHECKBOX}
                          aria-label={`${item.nombre} OK`}
                        />
                      </label>
                    );
                  })}
                  {itemsSoftware.length === 0 && (
                    <p className="text-xs text-tenue">
                      No hay ítems de software activos.
                    </p>
                  )}
                </div>
                <label className="mt-3 block">
                  <span className="etiqueta-tecnica text-[9px] text-tenue">
                    Observación software
                  </span>
                  <input
                    name={`sw-${computadora.id}`}
                    type="text"
                    defaultValue={equipo?.observacionSoftware ?? ""}
                    placeholder="Observación de la semana"
                    disabled={guardando}
                    className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
                  />
                </label>
              </section>
            </div>
          </article>
        );
      })}

      {computadoras.every((computadora) => !coincideBusqueda(computadora)) && (
        <div className="rounded-xl border border-dashed border-borde bg-superficie-clara p-6 text-sm text-tenue">
          No hay computadoras que coincidan con la búsqueda.
        </div>
      )}

      <label className="block rounded-xl border border-borde bg-tarjeta p-4">
        <span className="etiqueta-tecnica text-[9px] text-tenue">
          Observaciones generales de la semana
        </span>
        <textarea
          name="observaciones"
          rows={2}
          defaultValue={observaciones ?? ""}
          disabled={guardando}
          placeholder="Notas de la semana (opcional)"
          className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
        />
      </label>

      {mensaje && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-2 border-t border-borde bg-tarjeta px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg border border-borde bg-white px-4 py-2.5 text-sm font-medium text-texto transition hover:bg-superficie-clara disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={() => setConfirmando(true)}
          className="rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Completar semana"}
        </button>
      </div>

      <ModalConfirmacion
        abierto={confirmando}
        titulo="Completar la revisión"
        descripcion="Los ítems sin marcar se contarán como problemas. Después de completar la semana ya no se podrá editar."
        detalle={`${computadoras.length} computadora(s) · ${items.length} ítem(s) revisados.`}
        etiqueta="Auditoría / Cómputo"
        confirmarTexto="Sí, completar"
        pendiente={guardando}
        onConfirmar={() => {
          setConfirmando(false);
          void guardar(true);
        }}
        onCancelar={() => setConfirmando(false)}
      />
    </form>
  );
}
