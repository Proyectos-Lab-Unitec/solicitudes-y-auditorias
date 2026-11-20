"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoAccion, Rol } from "@/lib/types";
import { cambiarActivo, cambiarRol, eliminarUsuario } from "./actions";

export function UsuarioAcciones({
  id,
  nombre,
  rol,
  activo,
  esPropio,
}: {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  esPropio: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [rolLocal, setRolLocal] = useState<Rol>(rol);
  const [error, setError] = useState("");

  function ejecutar(accion: () => Promise<EstadoAccion>) {
    setError("");

    startTransition(async () => {
      const resultado = await accion();

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la acción.");
        setRolLocal(rol);
        return;
      }

      router.refresh();
    });
  }

  if (esPropio) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="rounded-full bg-superficie-clara px-2.5 py-1 text-[11px] font-medium text-tenue">
          Tu cuenta
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={rolLocal}
          disabled={pendiente}
          onChange={(event) => {
            const nuevo = event.target.value as Rol;
            setRolLocal(nuevo);
            ejecutar(() => cambiarRol(id, nuevo));
          }}
          className="rounded-lg border border-borde bg-white px-2 py-1.5 text-xs text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
        >
          <option value="usuario">Usuario</option>
          <option value="consulta">Consulta</option>
          <option value="admin">Administrador</option>
        </select>

        <button
          type="button"
          disabled={pendiente}
          onClick={() => ejecutar(() => cambiarActivo(id, !activo))}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
            activo
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {activo ? "Desactivar" : "Activar"}
        </button>

        <button
          type="button"
          disabled={pendiente}
          onClick={() => {
            if (
              window.confirm(
                `¿Eliminar la cuenta de ${nombre}? Esta acción no se puede deshacer.`
              )
            ) {
              ejecutar(() => eliminarUsuario(id));
            }
          }}
          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
