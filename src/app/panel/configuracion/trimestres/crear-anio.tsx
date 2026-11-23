"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar } from "react-icons/fi";
import type { EstadoAccion } from "@/lib/types";
import { crearAnio } from "./actions";

const INICIAL: EstadoAccion = { ok: false };

export function CrearAnio({ anio }: { anio: number }) {
  const router = useRouter();
  const [estado, formAction, pendiente] = useActionState(crearAnio, INICIAL);

  useEffect(() => {
    if (estado.ok) router.refresh();
  }, [estado, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="anio" value={anio} />
      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex items-center gap-2 rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiCalendar className="size-4" />
        {pendiente ? "Creando…" : `Crear Q1–Q4 de ${anio}`}
      </button>

      {estado.mensaje && (
        <p className="max-w-xs text-right text-xs text-green-700">
          {estado.mensaje}
        </p>
      )}
      {estado.error && (
        <p className="max-w-xs text-right text-xs text-red-600">
          {estado.error}
        </p>
      )}
    </form>
  );
}
