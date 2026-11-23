"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiRefreshCw } from "react-icons/fi";
import { ModalConfirmacion } from "@/components/modal-confirmacion";
import {
  esLunes,
  finTrimestreDesde,
  formatearFecha,
  formatearSemana,
  type Trimestre,
} from "@/lib/computo";
import type { EstadoAccion } from "@/lib/types";
import { guardarTrimestre } from "./actions";

const INICIAL: EstadoAccion = { ok: false };

export function FormTrimestre({
  anio,
  trimestre,
  fechaInicio,
  configurado,
  auditorias,
  actualizadoEn,
  actualizadoPor,
}: {
  anio: number;
  trimestre: Trimestre;
  fechaInicio: string;
  configurado: boolean;
  auditorias: number;
  actualizadoEn: string | null;
  actualizadoPor: string | null;
}) {
  const router = useRouter();
  const [estado, formAction, pendiente] = useActionState(
    guardarTrimestre,
    INICIAL
  );
  const formRef = useRef<HTMLFormElement>(null);
  const confirmadoRef = useRef(false);
  const [fecha, setFecha] = useState(fechaInicio);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (estado.ok) router.refresh();
  }, [estado, router]);

  const fechaValida = esLunes(fecha);
  const rangoSemana1 = fechaValida ? formatearSemana(fecha) : null;
  const fin = fechaValida ? formatearFecha(finTrimestreDesde(fecha)) : null;

  function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    if (auditorias > 0 && !confirmadoRef.current) {
      event.preventDefault();
      setAbierto(true);
      return;
    }

    confirmadoRef.current = false;
  }

  function confirmarRecalculo() {
    confirmadoRef.current = true;
    setAbierto(false);
    formRef.current?.requestSubmit();
  }

  return (
    <section className="rounded-xl border border-borde bg-tarjeta p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            {anio} / {trimestre}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-texto">
            Trimestre {trimestre}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${
              configurado
                ? "bg-green-50 text-green-700 ring-green-100"
                : "bg-slate-100 text-slate-700 ring-slate-200"
            }`}
          >
            {configurado ? "Configurado" : "Sin configurar"}
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-acento ring-1 ring-blue-100 ring-inset">
            10 semanas
          </span>
        </div>
      </div>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={manejarEnvio}
        className="mt-4 space-y-4"
      >
        <input type="hidden" name="anio" value={anio} />
        <input type="hidden" name="trimestre" value={trimestre} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-texto">
            Lunes de la semana 1
          </span>
          <input
            type="date"
            name="fecha_inicio"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            required
            disabled={pendiente}
            className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
          />
          {!fechaValida && (
            <span className="mt-1 block text-xs text-red-600">
              La fecha debe ser un lunes.
            </span>
          )}
        </label>

        <div className="rounded-lg border border-borde bg-superficie-clara px-3 py-2.5 text-xs leading-5 text-tenue">
          {fechaValida ? (
            <>
              <p>
                <span className="font-semibold text-texto">Semana 1:</span>{" "}
                {rangoSemana1}
              </p>
              <p>
                <span className="font-semibold text-texto">
                  Semana 10 termina:
                </span>{" "}
                {fin}
              </p>
            </>
          ) : (
            <p>Selecciona un lunes para ver el rango completo.</p>
          )}
        </div>

        {auditorias > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Hay {auditorias} auditoría(s) registrada(s). Al guardar se
            recalcularán sus fechas.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] leading-5 text-tenue">
            {actualizadoEn ? (
              <p>
                Actualizado: {actualizadoEn}
                {actualizadoPor ? ` · ${actualizadoPor}` : ""}
              </p>
            ) : (
              <p>Todavía no tiene configuración guardada.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pendiente || !fechaValida}
            className="inline-flex items-center gap-2 rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
          >
            {auditorias > 0 ? (
              <FiRefreshCw className="size-4" />
            ) : (
              <FiCalendar className="size-4" />
            )}
            {pendiente ? "Guardando…" : "Guardar trimestre"}
          </button>
        </div>

        {estado.mensaje && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {estado.mensaje}
          </p>
        )}
        {estado.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {estado.error}
          </p>
        )}
      </form>

      <ModalConfirmacion
        abierto={abierto}
        titulo={`Recalcular ${trimestre} ${anio}`}
        descripcion={`Se moverán ${auditorias} auditoría(s) registrada(s) a las semanas calculadas desde la nueva fecha. Las respuestas y observaciones no se borran.`}
        detalle={
          fechaValida
            ? `Semana 1: ${rangoSemana1} · Semana 10 termina: ${fin}`
            : undefined
        }
        etiqueta="Configuración / Trimestres"
        confirmarTexto="Guardar y recalcular"
        onConfirmar={confirmarRecalculo}
        onCancelar={() => setAbierto(false)}
      />
    </section>
  );
}
