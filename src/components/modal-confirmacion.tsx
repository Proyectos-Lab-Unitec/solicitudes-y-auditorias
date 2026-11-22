"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiCheckCircle, FiX } from "react-icons/fi";

type Variante = "primario" | "peligro";

/**
 * Diálogo de confirmación del sistema. Reemplaza los `window.confirm` del
 * navegador para que los avisos usen la misma identidad visual que el panel.
 */
export function ModalConfirmacion({
  abierto,
  titulo,
  descripcion,
  detalle,
  etiqueta = "Confirmación",
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  variante = "primario",
  pendiente = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  detalle?: string;
  etiqueta?: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  variante?: Variante;
  pendiente?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const tituloId = useId();
  const descripcionId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelarRef = useRef(onCancelar);

  useEffect(() => {
    onCancelarRef.current = onCancelar;
  }, [onCancelar]);

  useEffect(() => {
    if (!abierto) return;

    function alPresionar(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendiente) {
        onCancelarRef.current();
      }

      if (event.key === "Tab" && dialogRef.current) {
        const enfocables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (enfocables.length === 0) return;

        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        const activo = document.activeElement;

        if (event.shiftKey && activo === primero) {
          event.preventDefault();
          ultimo.focus();
        } else if (!event.shiftKey && activo === ultimo) {
          event.preventDefault();
          primero.focus();
        }
      }
    }

    document.addEventListener("keydown", alPresionar);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelarRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowOriginal;
    };
  }, [abierto, pendiente]);

  if (!abierto) return null;

  const esPeligro = variante === "peligro";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-fondo-profundo/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pendiente) {
          onCancelar();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
        className="w-full max-w-md overflow-hidden rounded-xl bg-tarjeta shadow-2xl ring-1 ring-borde"
      >
        <div className="rejilla-tecnica relative flex items-center justify-between bg-fondo px-5 py-3">
          <p className="etiqueta-tecnica text-[9px] text-acento-claro">
            {etiqueta}
          </p>
          <button
            type="button"
            onClick={onCancelar}
            disabled={pendiente}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <FiX className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex gap-4">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ring-1 ${
                esPeligro
                  ? "bg-red-50 text-red-600 ring-red-100"
                  : "bg-blue-50 text-acento ring-blue-100"
              }`}
            >
              {esPeligro ? (
                <FiAlertTriangle className="size-5" />
              ) : (
                <FiCheckCircle className="size-5" />
              )}
            </span>

            <div className="min-w-0">
              <h2
                id={tituloId}
                className="text-base font-semibold leading-6 text-texto"
              >
                {titulo}
              </h2>
              <p id={descripcionId} className="mt-1.5 text-sm leading-6 text-tenue">
                {descripcion}
              </p>
              {detalle && (
                <p className="etiqueta-tecnica mt-3 rounded-md border border-borde bg-superficie-clara px-3 py-2 text-[9px] leading-5 normal-case tracking-normal text-tenue">
                  {detalle}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-borde bg-superficie-clara/50 px-5 py-3">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={pendiente}
            className="rounded-lg border border-borde bg-white px-4 py-2 text-sm font-medium text-tenue transition hover:bg-superficie-clara disabled:opacity-60"
          >
            {cancelarTexto}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={pendiente}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              esPeligro
                ? "bg-red-600 hover:bg-red-700"
                : "bg-superficie-azul hover:bg-acento"
            }`}
          >
            {pendiente ? "Procesando…" : confirmarTexto}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
