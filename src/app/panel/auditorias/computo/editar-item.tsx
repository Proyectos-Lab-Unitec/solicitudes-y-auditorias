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
      const resultado = await actualizarItem(item.id, {
        nombre: String(formData.get("nombre") ?? ""),
        categoria: String(formData.get("categoria") ?? ""),
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
          descripcion="Actualiza el nombre y la categoría. El orden se cambia con las flechas del listado."
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
        </ModalEdicion>
      )}
    </>
  );
}
