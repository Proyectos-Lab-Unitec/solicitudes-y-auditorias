"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, supabaseConfigurado } from "@/lib/supabase/client";
import {
  DOMINIO_INSTITUCIONAL,
  esCorreoInstitucional,
} from "@/lib/constantes";
import { conTimeout } from "@/lib/tiempo";

export function RegistroForm({ next = "/panel" }: { next?: string }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  async function registrarse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cargando) return;

    setError("");

    if (nombre.trim().length < 3) {
      setError("Escribe tu nombre completo.");
      return;
    }

    if (!esCorreoInstitucional(correo)) {
      setError(`Usa un correo institucional @${DOMINIO_INSTITUCIONAL}.`);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      if (!supabaseConfigurado()) {
        throw new Error(
          "Falta configurar Supabase. Revisa las variables de entorno."
        );
      }

      const supabase = createClient();
      const { data, error: registroError } = await conTimeout(
        supabase.auth.signUp({
          email: correo.trim().toLowerCase(),
          password,
          options: {
            data: { nombre: nombre.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        })
      );

      if (registroError) throw registroError;

      // Si Supabase devolvió sesión (confirmación de correo desactivada),
      // se cierra de inmediato: la cuenta todavía no está aprobada.
      if (data.session) {
        await conTimeout(supabase.auth.signOut(), 5_000).catch(() => {});
      }

      setExito(true);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error al crear la cuenta.";

      setError(
        mensaje.includes("User already registered")
          ? "Ese correo ya tiene una cuenta. Intenta iniciar sesión."
          : mensaje
      );
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <div>
          <h2 className="text-2xl font-bold text-texto">Cuenta creada</h2>
          <p className="mt-2 text-sm leading-6 text-tenue">
            Revisa tu correo institucional si se te pidió confirmación. Después,
            un administrador debe <strong>aprobar tu cuenta</strong> y asignarte
            el rol de acceso.
          </p>
        </div>
        <Link
          href={
            next !== "/panel"
              ? `/login?next=${encodeURIComponent(next)}`
              : "/login"
          }
          className="inline-flex w-full items-center justify-center rounded-lg bg-superficie-azul py-3 text-base font-semibold text-white transition-colors hover:bg-acento"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-texto">Crear cuenta</h2>
        <p className="mt-1 text-sm text-tenue">
          Regístrate con tu correo institucional. Un administrador aprobará tu
          acceso.
        </p>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
        La cuenta se crea <strong>inactiva</strong>. El administrador la activa
        y le asigna el rol correspondiente.
      </div>

      <form onSubmit={registrarse} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-texto">
            Nombre completo
          </span>
          <input
            type="text"
            required
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellidos"
            disabled={cargando}
            className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-texto">
            Correo institucional
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder={`nombre@${DOMINIO_INSTITUCIONAL}`}
            disabled={cargando}
            className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-texto">
            Contraseña
          </span>
          <div className="relative">
            <input
              type={verPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={cargando}
              className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 pr-20 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setVerPassword((valor) => !valor)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-acento transition hover:text-superficie-azul"
            >
              {verPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-texto">
            Confirmar contraseña
          </span>
          <input
            type={verPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repite la contraseña"
            disabled={cargando}
            className="w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20 disabled:opacity-60"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-superficie-azul py-3 text-base font-semibold text-white transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-tenue">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={
            next !== "/panel"
              ? `/login?next=${encodeURIComponent(next)}`
              : "/login"
          }
          className="font-semibold text-acento transition hover:text-superficie-azul"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
