"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { moverItem } from "./actions";

export function ReordenarItem({
  id,
  nombre,
  arribaHabilitado,
  abajoHabilitado,
}: {
  id: string;
  nombre: string;
  arribaHabilitado: boolean;
  abajoHabilitado: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");

  function mover(direccion: "arriba" | "abajo") {
    setError("");

    startTransition(async () => {
      const resultado = await moverItem(id, direccion);

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo mover el ítem.");
        return;
      }

      router.refresh();
    });
  }

  const claseBoton =
    "flex size-7 items-center justify-center rounded-lg border border-borde bg-white text-tenue transition hover:bg-superficie-clara hover:text-texto disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => mover("arriba")}
          disabled={pendiente || !arribaHabilitado}
          title="Subir ítem"
          aria-label={`Subir ${nombre}`}
          className={claseBoton}
        >
          <FiArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => mover("abajo")}
          disabled={pendiente || !abajoHabilitado}
          title="Bajar ítem"
          aria-label={`Bajar ${nombre}`}
          className={claseBoton}
        >
          <FiArrowDown className="size-3.5" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
