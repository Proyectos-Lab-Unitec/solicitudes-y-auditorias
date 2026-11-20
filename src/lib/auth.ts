import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

/**
 * Lee el perfil del usuario autenticado.
 *
 * No llama a connection(): se usa tanto en render (donde la página ya forzó
 * request time) como en Server Actions.
 */
export async function getPerfilActual(): Promise<Perfil | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, correo, rol, activo, area")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as Perfil;
}

export async function requirePerfil(): Promise<Perfil> {
  const perfil = await getPerfilActual();

  if (!perfil || !perfil.activo) {
    redirect("/login?inactivo=1");
  }

  return perfil;
}

export async function requireAdmin(): Promise<Perfil> {
  const perfil = await requirePerfil();

  if (perfil.rol !== "admin") {
    redirect("/panel");
  }

  return perfil;
}
