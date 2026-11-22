"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { actualizarUsuario } from "./actions";

const CLASE_INPUT =
  "w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60";

export function EditarUsuarioModal({
  id,
  nombre,
  correo,
  area,
  esPropio,
  onClose,
}: {
  id: string;
  nombre: string;
  correo: string;
  area: string | null;
  esPropio: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function alPresionar(event: KeyboardEvent) {
      if (event.key === "Escape" && !guardando) {
        onClose();
      }
    }

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [guardando, onClose]);

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardando) return;

    const formData = new FormData(event.currentTarget);
    setGuardando(true);
    setError("");

    try {
      const resultado = await actualizarUsuario(id, {
        nombre: String(formData.get("nombre") ?? ""),
        correo: String(formData.get("correo") ?? ""),
        area: String(formData.get("area") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar el usuario.");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el usuario."
      );
    } finally {
      setGuardando(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !guardando) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editar-usuario"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-tarjeta p-6 shadow-2xl ring-1 ring-borde"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="etiqueta-tecnica text-[9px] text-acento">
              Usuario / Editar
            </p>
            <h2
              id="titulo-editar-usuario"
              className="mt-1 text-lg font-semibold text-texto"
            >
              Editar usuario
            </h2>
            <p className="mt-1 text-sm text-tenue">
              Actualiza los datos de la cuenta.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-tenue transition hover:bg-superficie-clara hover:text-texto disabled:opacity-50"
          >
            <FiX className="size-5" />
          </button>
        </div>

        <form onSubmit={guardar} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Nombre completo
            </span>
            <input
              name="nombre"
              type="text"
              required
              autoFocus
              defaultValue={nombre}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Correo institucional
            </span>
            <input
              name="correo"
              type="email"
              required
              defaultValue={correo}
              readOnly={esPropio}
              disabled={guardando}
              className={`${CLASE_INPUT} ${
                esPropio ? "bg-superficie-clara text-tenue" : ""
              }`}
            />
            {esPropio && (
              <span className="mt-1 block text-xs text-tenue">
                No puedes cambiar tu propio correo desde aquí.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Área (opcional)
            </span>
            <input
              name="area"
              type="text"
              defaultValue={area ?? ""}
              disabled={guardando}
              className={CLASE_INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Nueva contraseña (opcional)
            </span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Dejar vacío para conservar la actual"
              disabled={guardando}
              className={CLASE_INPUT}
            />
            <span className="mt-1 block text-xs text-tenue">
              Si la escribes, debe tener al menos 8 caracteres.
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="rounded-lg border border-borde px-4 py-2 text-sm font-medium text-tenue transition hover:bg-superficie-clara disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-superficie-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
