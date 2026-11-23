"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiRotateCcw } from "react-icons/fi";
import { ModalConfirmacion } from "@/components/modal-confirmacion";
import { reabrirSemana } from "../actions";

export function ReabrirSemana({ auditoriaId }: { auditoriaId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  function confirmar() {
    setError("");

    startTransition(async () => {
      const resultado = await reabrirSemana(auditoriaId);

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo reabrir la semana.");
        return;
      }

      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setError("");
          setAbierto(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 text-xs font-semibold text-texto transition hover:bg-superficie-clara"
      >
        <FiRotateCcw className="size-3.5" />
        Reabrir para edición
      </button>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ModalConfirmacion
        abierto={abierto}
        titulo="Reabrir la semana"
        descripcion="La semana volverá a borrador para que puedas corregirla. El registro de cuándo se completó se borra y se guardará de nuevo al finalizar."
        detalle="Podrás volver a completarla cuando termines los ajustes."
        etiqueta="Auditoría / Cómputo"
        confirmarTexto="Sí, reabrir"
        pendiente={pendiente}
        onConfirmar={confirmar}
        onCancelar={() => setAbierto(false)}
      />
    </div>
  );
}
