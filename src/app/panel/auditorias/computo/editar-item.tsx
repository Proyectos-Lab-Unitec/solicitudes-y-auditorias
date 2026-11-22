"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/computo";
import { actualizarItem } from "./actions";
import { CLASE_INPUT, ModalEdicion } from "./modal-edicion";

export function EditarItem({
  item,
}: {
  item: {
    id: string;
    nombre: string;
    categoria: string;
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
      const resultado = await actualizarItem(item.id, {
        nombre: String(formData.get("nombre") ?? ""),
        categoria: String(formData.get("categoria") ?? ""),
        orden: Number.isFinite(orden) ? orden : 0,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar el ítem.");
        return;
      }

      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el ítem."
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
          titulo="Editar ítem"
          etiqueta="Ítem / Editar"
          descripcion="Actualiza el nombre, la categoría y el orden."
          guardando={guardando}
          error={error}
          onClose={() => setAbierto(false)}
          onGuardar={guardar}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Ítem que se revisa
            </span>
            <input
              name="nombre"
              type="text"
              required
              autoFocus
              defaultValue={item.nombre}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Categoría
            </span>
            <select
              name="categoria"
              defaultValue={item.categoria}
              disabled={guardando}
              className={CLASE_INPUT}
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Orden
            </span>
            <input
              name="orden"
              type="number"
              defaultValue={item.orden}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>
        </ModalEdicion>
      )}
    </>
  );
}
