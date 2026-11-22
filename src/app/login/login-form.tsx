"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { puedeVerRuta } from "@/lib/rutas";
import { createClient, supabaseConfigurado } from "@/lib/supabase/client";
import { conTimeout } from "@/lib/tiempo";
import type { Rol } from "@/lib/types";

type Aviso = { texto: string; tipo: "info" | "exito" | "error" };

export function LoginForm({
  avisoInicial,
  next = "/panel",
}: {
  avisoInicial?: Aviso;
  next?: string;
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cargando) return;

    setCargando(true);
    setError("");

    try {
      if (!supabaseConfigurado()) {
        throw new Error(
          "Falta configurar Supabase. Revisa las variables de entorno."
        );
      }

      const supabase = createClient();

      const { data: sesion, error: loginError } = await conTimeout(
        supabase.auth.signInWithPassword({
          email: correo.trim().toLowerCase(),
          password,
        })
      );

      if (loginError) throw loginError;

      const { data: perfil, error: perfilError } = await conTimeout(
        supabase
          .from("perfiles")
          .select("rol, activo")
          .eq("id", sesion.user.id)
          .single()
      );

      if (perfilError) {
        throw new Error(
          "No se encontró tu perfil. Contacta al administrador."
        );
      }

      if (!perfil.activo) {
        await conTimeout(supabase.auth.signOut(), 5_000).catch(() => {});
        throw new Error(
          "Tu cuenta está pendiente de aprobación o fue desactivada. Contacta al administrador."
        );
      }

      setPassword("");

      // Vuelve al módulo solicitado si el rol tiene acceso; si no, al panel.
      const destino = puedeVerRuta(perfil.rol as Rol, next) ? next : "/panel";
      router.push(destino);
      router.refresh();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error al iniciar sesión.";

      setError(
        mensaje.includes("Invalid login credentials")
          ? "Correo o contraseña incorrectos."
          : mensaje.includes("Email not confirmed")
            ? "Debes confirmar tu correo institucional antes de entrar."
            : mensaje
      );

      try {
        await conTimeout(createClient().auth.signOut(), 5_000);
      } catch {
        // La sesión a medias se ignora; lo importante es liberar el botón.
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-texto">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-sm text-tenue">
          Accede con tu correo institucional.
        </p>
      </div>

      {avisoInicial && (
        <div
          className={
            avisoInicial.tipo === "exito"
              ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              : avisoInicial.tipo === "error"
                ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          }
        >
          {avisoInicial.texto}
        </div>
      )}

      {next !== "/panel" && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Inicia sesión para continuar con el módulo que seleccionaste.
        </div>
      )}

      <form onSubmit={iniciarSesion} className="space-y-4">
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
            placeholder="nombre@unitec.edu"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
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
          {cargando ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-sm text-tenue">
        ¿No tienes cuenta?{" "}
        <Link
          href={
            next !== "/panel"
              ? `/registro?next=${encodeURIComponent(next)}`
              : "/registro"
          }
          className="font-semibold text-acento transition hover:text-superficie-azul"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
