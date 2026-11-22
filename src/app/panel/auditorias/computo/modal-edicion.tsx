"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactNode } from "react";
import { FiX } from "react-icons/fi";

export const CLASE_INPUT =
  "w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60";

export function ModalEdicion({
  titulo,
  etiqueta,
  descripcion,
  guardando,
  error,
  onClose,
  onGuardar,
  children,
}: {
  titulo: string;
  etiqueta: string;
  descripcion: string;
  guardando: boolean;
  error: string;
  onClose: () => void;
  onGuardar: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function alPresionar(event: KeyboardEvent) {
      if (event.key === "Escape" && !guardando) onClose();
    }

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [guardando, onClose]);

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
        aria-label={titulo}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-tarjeta p-6 shadow-2xl ring-1 ring-borde"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="etiqueta-tecnica text-[9px] text-acento">
              {etiqueta}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-texto">{titulo}</h2>
            <p className="mt-1 text-sm text-tenue">{descripcion}</p>
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

        <form onSubmit={onGuardar} className="mt-5 space-y-4">
          {children}

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
