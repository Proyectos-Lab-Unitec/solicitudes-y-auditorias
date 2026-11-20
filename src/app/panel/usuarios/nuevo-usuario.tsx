"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import type { EstadoAccion } from "@/lib/types";
import { crearUsuario } from "./actions";

const ESTADO_INICIAL: EstadoAccion = { ok: false };

export function NuevoUsuarioForm() {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction, pendiente] = useActionState(
    crearUsuario,
    ESTADO_INICIAL
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <section className="rounded-2xl bg-tarjeta shadow-sm ring-1 ring-borde">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-texto">Nuevo usuario</h2>
          <p className="text-sm text-tenue">
            Crea una cuenta activa con contraseña temporal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          className="inline-flex items-center gap-2 rounded-lg bg-superficie-azul px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-acento"
        >
          {abierto ? <FiX className="size-4" /> : <FiPlus className="size-4" />}
          {abierto ? "Cancelar" : "Crear usuario"}
        </button>
      </div>

      {estado.ok && estado.mensaje && (
        <p className="mx-4 mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 sm:mx-5">
          {estado.mensaje}
        </p>
      )}

      {abierto && (
        <form
          ref={formRef}
          action={formAction}
          className="grid gap-4 border-t border-borde p-4 sm:grid-cols-2 sm:p-5"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Nombre completo
            </span>
            <input
              name="nombre"
              type="text"
              required
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
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
              placeholder="nombre@unitec.edu"
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Área (opcional)
            </span>
            <input
              name="area"
              type="text"
              placeholder="Ej. Laboratorio de cómputo"
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Rol
            </span>
            <select
              name="rol"
              defaultValue="usuario"
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            >
              <option value="usuario">Usuario (Jefe de área / Instructor)</option>
              <option value="consultor">Consultor</option>
              <option value="checklist">Checklist</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-texto">
              Contraseña temporal
            </span>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            />
            <span className="mt-1 block text-xs text-tenue">
              Compártela con la persona; puede cambiarla después.
            </span>
          </label>

          {estado.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {estado.error}
            </p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg border border-borde px-4 py-2 text-sm font-medium text-tenue transition hover:bg-superficie-clara"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-lg bg-superficie-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendiente ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
