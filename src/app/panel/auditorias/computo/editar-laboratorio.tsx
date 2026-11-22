"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarLaboratorio } from "./actions";
import { CLASE_INPUT, ModalEdicion } from "./modal-edicion";

export function EditarLaboratorio({
  laboratorio,
}: {
  laboratorio: {
    id: string;
    codigo: string;
    nombre: string;
    ubicacion: string | null;
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
    setGuardando(true);
    setError("");

    try {
      const resultado = await actualizarLaboratorio(laboratorio.id, {
        codigo: String(formData.get("codigo") ?? ""),
        nombre: String(formData.get("nombre") ?? ""),
        ubicacion: String(formData.get("ubicacion") ?? ""),
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar el laboratorio.");
        return;
      }

      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el laboratorio."
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
        className="rounded-lg border border-borde bg-white px-3 py-2 text-sm font-medium text-tenue transition hover:bg-superficie-clara hover:text-texto"
      >
        Editar datos
      </button>

      {abierto && (
        <ModalEdicion
          titulo="Editar laboratorio"
          etiqueta="Laboratorio / Editar"
          descripcion="Actualiza el código, el nombre y la ubicación."
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
              defaultValue={laboratorio.codigo}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Nombre
            </span>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={laboratorio.nombre}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Ubicación (opcional)
            </span>
            <input
              name="ubicacion"
              type="text"
              placeholder="Edificio, piso, aula"
              defaultValue={laboratorio.ubicacion ?? ""}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>
        </ModalEdicion>
      )}
    </>
  );
}
