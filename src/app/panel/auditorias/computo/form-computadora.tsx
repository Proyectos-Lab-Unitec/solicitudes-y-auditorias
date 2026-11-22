"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { EstadoAccion } from "@/lib/types";
import { crearComputadora } from "./actions";

const INICIAL: EstadoAccion = { ok: false };

export function FormComputadora({
  laboratorioId,
  siguienteOrden,
}: {
  laboratorioId: string;
  siguienteOrden: number;
}) {
  const router = useRouter();
  const [estado, formAction, pendiente] = useActionState(
    crearComputadora,
    INICIAL
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [estado, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-borde bg-superficie-clara p-4 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end"
    >
      <input type="hidden" name="laboratorio_id" value={laboratorioId} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Código
        </span>
        <input
          name="codigo"
          type="text"
          required
          placeholder="PC-01"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Nombre (opcional)
        </span>
        <input
          name="nombre"
          type="text"
          placeholder="Equipo 1"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Orden
        </span>
        <input
          name="orden"
          type="number"
          defaultValue={siguienteOrden}
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Guardando…" : "Agregar computadora"}
      </button>

      {estado.mensaje && estado.ok && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 sm:col-span-4">
          {estado.mensaje}
        </p>
      )}

      {estado.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-4">
          {estado.error}
        </p>
      )}
    </form>
  );
}
