"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EstadoAccion } from "@/lib/types";
import { crearLaboratorio } from "./actions";

const INICIAL: EstadoAccion = { ok: false };

export function FormLaboratorio() {
  const [estado, formAction, pendiente] = useActionState(
    crearLaboratorio,
    INICIAL
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-borde bg-superficie-clara p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Código
        </span>
        <input
          name="codigo"
          type="text"
          required
          placeholder="COMP-01"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
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
          placeholder="Laboratorio de cómputo 1"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
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
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          N.º de computadoras
        </span>
        <input
          name="cantidad"
          type="number"
          required
          min={1}
          max={200}
          defaultValue={1}
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-texto">
          Prefijo
        </span>
        <input
          name="prefijo"
          type="text"
          maxLength={6}
          defaultValue="PC"
          className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
      </label>

      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg bg-superficie-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
      >
        {pendiente ? "Creando…" : "Crear laboratorio"}
      </button>

      <p className="etiqueta-tecnica text-[9px] text-tenue sm:col-span-2 lg:col-span-3">
        Se crearán automáticamente las computadoras con el prefijo indicado:
        PC-01, PC-02, …
      </p>

      {estado.mensaje && estado.ok && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 sm:col-span-2 lg:col-span-3">
          {estado.mensaje}
        </p>
      )}

      {estado.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2 lg:col-span-3">
          {estado.error}
        </p>
      )}
    </form>
  );
}
