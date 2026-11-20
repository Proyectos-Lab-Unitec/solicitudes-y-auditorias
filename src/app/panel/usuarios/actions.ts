"use server";

import { revalidatePath } from "next/cache";
import { esCorreoInstitucional } from "@/lib/constantes";
import { getPerfilActual } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoAccion, Rol } from "@/lib/types";

const ROLES: Rol[] = ["admin", "usuario", "consultor", "checklist"];

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

async function exigirAdmin() {
  const perfil = await getPerfilActual();

  if (!perfil || !perfil.activo || perfil.rol !== "admin") {
    return null;
  }

  return perfil;
}

/**
 * Indica si el usuario es un administrador activo y además el único que queda.
 * Evita que el sistema se quede sin administradores.
 */
async function esUltimoAdminActivo(
  supabase: ReturnType<typeof createAdminClient>,
  id: string
) {
  const { data: objetivo } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", id)
    .single();

  if (!objetivo || objetivo.rol !== "admin" || !objetivo.activo) {
    return false;
  }

  const { count } = await supabase
    .from("perfiles")
    .select("id", { count: "exact", head: true })
    .eq("rol", "admin")
    .eq("activo", true);

  return (count ?? 0) <= 1;
}

export async function crearUsuario(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const nombre = texto(formData, "nombre");
  const correo = texto(formData, "correo").toLowerCase();
  const area = texto(formData, "area");
  const rol = texto(formData, "rol") as Rol;
  const password = texto(formData, "password");

  if (nombre.length < 3) {
    return { ok: false, error: "Escribe el nombre completo." };
  }

  if (!correo || !esCorreoInstitucional(correo)) {
    return { ok: false, error: "Usa un correo institucional válido." };
  }

  if (!ROLES.includes(rol)) {
    return { ok: false, error: "Selecciona un rol válido." };
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: "La contraseña temporal debe tener al menos 8 caracteres.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: correo,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });

    if (error) {
      return {
        ok: false,
        error: error.message.includes("already been registered")
          ? "Ese correo ya tiene una cuenta."
          : error.message,
      };
    }

    if (!data.user) {
      return { ok: false, error: "No se pudo crear el usuario." };
    }

    const { error: perfilError } = await supabase
      .from("perfiles")
      .update({ rol, activo: true, area: area || null })
      .eq("id", data.user.id);

    if (perfilError) {
      // Revierte la creación para no dejar un usuario sin perfil utilizable.
      await supabase.auth.admin.deleteUser(data.user.id);
      return { ok: false, error: perfilError.message };
    }

    revalidatePath("/panel/usuarios");
    return { ok: true, mensaje: `Usuario ${correo} creado y activado.` };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear el usuario.",
    };
  }
}

export async function cambiarRol(
  id: string,
  rol: string
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  if (!ROLES.includes(rol as Rol)) {
    return { ok: false, error: "Rol inválido." };
  }

  if (id === admin.id) {
    return { ok: false, error: "No puedes cambiar tu propio rol." };
  }

  try {
    const supabase = createAdminClient();

    if (rol !== "admin" && (await esUltimoAdminActivo(supabase, id))) {
      return {
        ok: false,
        error: "Debe quedar al menos un administrador activo.",
      };
    }

    const { error } = await supabase
      .from("perfiles")
      .update({ rol })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/panel/usuarios");
    return { ok: true, mensaje: "Rol actualizado." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo cambiar el rol.",
    };
  }
}

export async function cambiarActivo(
  id: string,
  activo: boolean
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  if (id === admin.id) {
    return {
      ok: false,
      error: "No puedes desactivar tu propia cuenta.",
    };
  }

  try {
    const supabase = createAdminClient();

    if (!activo && (await esUltimoAdminActivo(supabase, id))) {
      return {
        ok: false,
        error: "Debe quedar al menos un administrador activo.",
      };
    }

    const { error } = await supabase
      .from("perfiles")
      .update({ activo })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/panel/usuarios");
    return {
      ok: true,
      mensaje: activo ? "Usuario activado." : "Usuario desactivado.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado.",
    };
  }
}

export async function eliminarUsuario(id: string): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  if (id === admin.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." };
  }

  try {
    const supabase = createAdminClient();

    if (await esUltimoAdminActivo(supabase, id)) {
      return {
        ok: false,
        error: "No puedes eliminar al último administrador activo.",
      };
    }

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/panel/usuarios");
    return { ok: true, mensaje: "Usuario eliminado." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario.",
    };
  }
}
