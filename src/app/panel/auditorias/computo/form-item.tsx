"use client";

import { useActionState, useEffect, useRef } from "react";
import { CATEGORIAS } from "@/lib/computo";
import type { EstadoAccion } from "@/lib/types";
import { crearItem } from "./actions";

const INICIAL: EstadoAccion = { ok: false };

export function FormItem() {
  const [estado, formAction, pendiente] = useActionState(crearItem, INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-borde bg-superficie-clara p-4 sm:grid-cols-[1fr_180px_100px_auto] sm:items-end"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Ítem que se revisa
        </span>
        <input
          name="nombre"
          type="text"
          required
          placeholder="Ej. Monitor encendido"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Categoría
        </span>
        <select
          name="categoria"
          defaultValue="Hardware"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
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
          defaultValue={0}
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Guardando…" : "Agregar"}
      </button>

      {estado.mensaje && estado.ok && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 sm:col-span-4">
          {estado.mensaje}
        </p>
      )}

      {estado.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-4">
          {estado.error}
        </p>
      )}
    </form>
  );
}
