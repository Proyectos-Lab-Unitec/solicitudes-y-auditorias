"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalConfirmacion } from "@/components/modal-confirmacion";
import type { EstadoAccion } from "@/lib/types";
import {
  eliminarComputadora,
  eliminarItem,
  eliminarLaboratorio,
} from "./actions";

type Tipo = "laboratorio" | "computadora" | "item";

const CONFIG: Record<
  Tipo,
  { titulo: string; detalle: string; etiqueta: string }
> = {
  laboratorio: {
    titulo: "Eliminar laboratorio",
    detalle: "Se borran sus computadoras y semanas registradas.",
    etiqueta: "Cómputo / Laboratorios",
  },
  computadora: {
    titulo: "Eliminar computadora",
    detalle: "Se borran sus respuestas en las semanas.",
    etiqueta: "Cómputo / Computadoras",
  },
  item: {
    titulo: "Eliminar ítem",
    detalle: "Se borran sus respuestas en las semanas.",
    etiqueta: "Cómputo / Ítems",
  },
};

export function BotonEliminar({
  id,
  tipo,
  redirigirA,
}: {
  id: string;
  tipo: Tipo;
  redirigirA?: string;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  function eliminar() {
    setError("");

    startTransition(async () => {
      const accion: Promise<EstadoAccion> =
        tipo === "laboratorio"
          ? eliminarLaboratorio(id)
          : tipo === "computadora"
            ? eliminarComputadora(id)
            : eliminarItem(id);

      const resultado = await accion;

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo eliminar.");
        return;
      }

      setConfirmando(false);

      if (redirigirA) {
        router.push(redirigirA);
      } else {
        router.refresh();
      }
    });
  }

  const config = CONFIG[tipo];

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setError("");
          setConfirmando(true);
        }}
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        Eliminar
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ModalConfirmacion
        abierto={confirmando}
        titulo={config.titulo}
        descripcion="Esta acción no se puede deshacer."
        detalle={config.detalle}
        etiqueta={config.etiqueta}
        confirmarTexto="Sí, eliminar"
        variante="peligro"
        pendiente={pendiente}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
