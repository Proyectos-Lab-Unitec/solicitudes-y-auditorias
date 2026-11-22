"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoAccion } from "@/lib/types";
import {
  cambiarActivoComputadora,
  cambiarActivoItem,
  cambiarActivoLaboratorio,
} from "./actions";

export function BotonEstado({
  id,
  activo,
  tipo,
}: {
  id: string;
  activo: boolean;
  tipo: "laboratorio" | "computadora" | "item";
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  function cambiar() {
    setError("");

    startTransition(async () => {
      const accion: Promise<EstadoAccion> =
        tipo === "laboratorio"
          ? cambiarActivoLaboratorio(id, !activo)
          : tipo === "computadora"
            ? cambiarActivoComputadora(id, !activo)
            : cambiarActivoItem(id, !activo);

      const resultado = await accion;

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la acción.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={cambiar}
        disabled={pendiente}
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
          activo
            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        {pendiente ? "…" : activo ? "Desactivar" : "Activar"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
