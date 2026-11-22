"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarComputadora } from "./actions";
import { CLASE_INPUT, ModalEdicion } from "./modal-edicion";

export function EditarComputadora({
  computadora,
}: {
  computadora: {
    id: string;
    laboratorioId: string;
    codigo: string;
    nombre: string | null;
    orden: number;
  };
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;

    const formData = new FormData(event.currentTarget);
    const orden = Number.parseInt(String(formData.get("orden") ?? "0"), 10);

    setGuardando(true);
    setError("");

    try {
      const resultado = await actualizarComputadora(
        computadora.id,
        computadora.laboratorioId,
        {
          codigo: String(formData.get("codigo") ?? ""),
          nombre: String(formData.get("nombre") ?? ""),
          orden: Number.isFinite(orden) ? orden : 0,
        }
      );

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar la computadora.");
        return;
      }

      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la computadora."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setAbierto(true);
        }}
        className="rounded-lg border border-borde bg-white px-2.5 py-1.5 text-xs font-medium text-tenue transition hover:bg-superficie-clara hover:text-texto"
      >
        Editar
      </button>

      {abierto && (
        <ModalEdicion
          titulo="Editar computadora"
          etiqueta="Computadora / Editar"
          descripcion="Actualiza el código, el nombre y el orden del equipo."
          guardando={guardando}
          error={error}
          onClose={() => setAbierto(false)}
          onGuardar={guardar}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Código
            </span>
            <input
              name="codigo"
              type="text"
              required
              autoFocus
              defaultValue={computadora.codigo}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Nombre (opcional)
            </span>
            <input
              name="nombre"
              type="text"
              defaultValue={computadora.nombre ?? ""}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Orden
            </span>
            <input
              name="orden"
              type="number"
              defaultValue={computadora.orden}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>
        </ModalEdicion>
      )}
    </>
  );
}
