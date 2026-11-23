"use server";

import { revalidatePath } from "next/cache";
import { getPerfilActual } from "@/lib/auth";
import {
  TRIMESTRES,
  esLunes,
  inicioTrimestre,
  type Trimestre,
} from "@/lib/computo";
import { puedeConfigurarTrimestres } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoAccion } from "@/lib/types";

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

async function exigirConfigurador() {
  const perfil = await getPerfilActual();

  if (
    !perfil ||
    !perfil.activo ||
    !puedeConfigurarTrimestres(perfil.rol)
  ) {
    return null;
  }

  return perfil;
}

function anioValido(valor: string) {
  const anio = Number.parseInt(valor, 10);
  return Number.isInteger(anio) && anio >= 2000 && anio <= 2100
    ? anio
    : null;
}

function revalidarConfiguracion() {
  revalidatePath("/panel/configuracion/trimestres");
  revalidatePath("/panel/auditorias/computo");
  revalidatePath("/panel", "layout");
}

export async function guardarTrimestre(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const perfil = await exigirConfigurador();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const anio = anioValido(texto(formData, "anio"));
  const trimestre = texto(formData, "trimestre") as Trimestre;
  const fechaInicio = texto(formData, "fecha_inicio");

  if (!anio) return { ok: false, error: "Selecciona un año válido." };
  if (!TRIMESTRES.includes(trimestre)) {
    return { ok: false, error: "Selecciona un trimestre válido." };
  }
  if (!fechaInicio) {
    return { ok: false, error: "Escribe la fecha de la semana 1." };
  }
  if (!esLunes(fechaInicio)) {
    return {
      ok: false,
      error: "La fecha de la semana 1 debe ser un lunes.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("guardar_trimestre_config", {
      p_anio: anio,
      p_trimestre: trimestre,
      p_fecha_inicio: fechaInicio,
      p_actualizado_por: perfil.id,
    });

    if (error) return { ok: false, error: error.message };

    const afectadas = typeof data === "number" ? data : 0;
    revalidarConfiguracion();

    return {
      ok: true,
      mensaje:
        afectadas > 0
          ? `Configuración guardada. Se recalcularon ${afectadas} auditoría(s).`
          : "Configuración guardada. No había auditorías registradas para recalcular.",
    };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la configuración.",
    };
  }
}

export async function crearAnio(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const perfil = await exigirConfigurador();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const anio = anioValido(texto(formData, "anio"));
  if (!anio) return { ok: false, error: "Selecciona un año válido." };

  try {
    const supabase = createAdminClient();
    const { data: existentes, error: errorExistentes } = await supabase
      .from("trimestres_config")
      .select("trimestre")
      .eq("anio", anio);

    if (errorExistentes) return { ok: false, error: errorExistentes.message };

    const configurados = new Set(
      (existentes ?? []).map((fila) => fila.trimestre)
    );
    const faltantes = TRIMESTRES.filter(
      (trimestre) => !configurados.has(trimestre)
    );

    if (faltantes.length === 0) {
      return { ok: true, mensaje: `El año ${anio} ya está configurado.` };
    }

    let afectadas = 0;

    for (const trimestre of faltantes) {
      const { data: ancla } = await supabase
        .from("auditorias_computo")
        .select("semana_inicio")
        .eq("anio", anio)
        .eq("trimestre", trimestre)
        .eq("numero_semana", 1)
        .limit(1)
        .maybeSingle();

      const fechaInicio =
        ancla?.semana_inicio ?? inicioTrimestre(trimestre, anio);

      const { data, error } = await supabase.rpc("guardar_trimestre_config", {
        p_anio: anio,
        p_trimestre: trimestre,
        p_fecha_inicio: fechaInicio,
        p_actualizado_por: perfil.id,
      });

      if (error) return { ok: false, error: error.message };
      afectadas += typeof data === "number" ? data : 0;
    }

    revalidarConfiguracion();

    return {
      ok: true,
      mensaje:
        afectadas > 0
          ? `Año ${anio} creado. Se recalcularon ${afectadas} auditoría(s).`
          : `Año ${anio} creado con Q1–Q4 en el calendario predeterminado.`,
    };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error
          ? caught.message
          : "No se pudo crear el año.",
    };
  }
}
