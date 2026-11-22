"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/auth";
import {
  CATEGORIAS,
  ESTADOS_RESPUESTA,
  TRIMESTRES,
  inicioTrimestre,
  sumarDias,
  type Categoria,
  type EstadoRespuesta,
  type Trimestre,
} from "@/lib/computo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoAccion } from "@/lib/types";

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

async function exigirChecklist() {
  const perfil = await getPerfilActual();

  if (!perfil || !perfil.activo || perfil.rol !== "checklist") {
    return null;
  }

  return perfil;
}

function revalidar(auditoriaId?: string) {
  revalidatePath("/panel/auditorias/computo");

  if (auditoriaId) {
    revalidatePath(`/panel/auditorias/computo/${auditoriaId}`);
  }
}

export async function crearLaboratorio(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const codigo = texto(formData, "codigo");
  const nombre = texto(formData, "nombre");
  const ubicacion = texto(formData, "ubicacion");
  const cantidadTexto = texto(formData, "cantidad");
  const cantidad = Number.parseInt(cantidadTexto || "0", 10);
  const prefijo =
    (texto(formData, "prefijo") || "PC")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 6) || "PC";

  if (!codigo) return { ok: false, error: "Escribe el código del laboratorio." };
  if (nombre.length < 3) {
    return { ok: false, error: "Escribe el nombre del laboratorio." };
  }
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 200) {
    return {
      ok: false,
      error: "Indica un número de computadoras entre 1 y 200.",
    };
  }

  try {
    const supabase = createAdminClient();

    const { data: creado, error } = await supabase
      .from("labs_computo")
      .insert({
        codigo,
        nombre,
        ubicacion: ubicacion || null,
        creado_por: perfil.id,
      })
      .select("id")
      .single();

    if (error || !creado) {
      return {
        ok: false,
        error:
          error?.code === "23505"
            ? "Ese código de laboratorio ya existe."
            : (error?.message ?? "No se pudo crear el laboratorio."),
      };
    }

    const ancho = Math.max(2, String(cantidad).length);
    const computadoras = Array.from({ length: cantidad }, (_, indice) => ({
      laboratorio_id: creado.id,
      codigo: `${prefijo}-${String(indice + 1).padStart(ancho, "0")}`,
      nombre: `Equipo ${indice + 1}`,
      orden: indice + 1,
      creado_por: perfil.id,
    }));

    const { error: compsError } = await supabase
      .from("computadoras")
      .insert(computadoras);

    if (compsError) {
      await supabase.from("labs_computo").delete().eq("id", creado.id);
      return { ok: false, error: compsError.message };
    }

    revalidar();
    return {
      ok: true,
      mensaje: `Laboratorio ${codigo} creado con ${cantidad} computadora(s).`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear el laboratorio.",
    };
  }
}

export async function cambiarActivoLaboratorio(
  id: string,
  activo: boolean
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("labs_computo")
      .update({ activo })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidar();
    return {
      ok: true,
      mensaje: activo ? "Laboratorio activado." : "Laboratorio desactivado.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el laboratorio.",
    };
  }
}

export async function crearComputadora(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const laboratorioId = texto(formData, "laboratorio_id");
  const codigo = texto(formData, "codigo");
  const nombre = texto(formData, "nombre");
  const ordenTexto = texto(formData, "orden");
  const orden = Number.parseInt(ordenTexto || "0", 10);

  if (!laboratorioId) {
    return { ok: false, error: "Selecciona un laboratorio." };
  }

  if (!codigo) return { ok: false, error: "Escribe el código de la computadora." };

  try {
    const supabase = createAdminClient();

    const { data: laboratorio } = await supabase
      .from("labs_computo")
      .select("id")
      .eq("id", laboratorioId)
      .maybeSingle();

    if (!laboratorio) {
      return { ok: false, error: "El laboratorio no existe." };
    }

    const { error } = await supabase.from("computadoras").insert({
      laboratorio_id: laboratorioId,
      codigo,
      nombre: nombre || null,
      orden: Number.isFinite(orden) ? orden : 0,
      creado_por: perfil.id,
    });

    if (error) {
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "Ese código ya existe en el laboratorio."
            : error.message,
      };
    }

    revalidar();
    revalidatePath(`/panel/auditorias/computo/laboratorios/${laboratorioId}`);
    return { ok: true, mensaje: `Computadora ${codigo} creada.` };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear la computadora.",
    };
  }
}

export async function cambiarActivoComputadora(
  id: string,
  activo: boolean
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("computadoras")
      .update({ activo })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidar();
    return {
      ok: true,
      mensaje: activo ? "Computadora activada." : "Computadora desactivada.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la computadora.",
    };
  }
}

export async function crearItem(
  _estado: EstadoAccion,
  formData: FormData
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  const nombre = texto(formData, "nombre");
  const categoria = texto(formData, "categoria") as Categoria;
  const ordenTexto = texto(formData, "orden");
  const orden = Number.parseInt(ordenTexto || "0", 10);

  if (nombre.length < 2) {
    return { ok: false, error: "Escribe el nombre del ítem." };
  }

  if (!CATEGORIAS.includes(categoria)) {
    return { ok: false, error: "Selecciona Hardware o Software." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("checklist_items").insert({
      nombre,
      categoria,
      orden: Number.isFinite(orden) ? orden : 0,
      creado_por: perfil.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidar();
    return { ok: true, mensaje: `Ítem "${nombre}" creado.` };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo crear el ítem.",
    };
  }
}

export async function cambiarActivoItem(
  id: string,
  activo: boolean
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("checklist_items")
      .update({ activo })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidar();
    return {
      ok: true,
      mensaje: activo ? "Ítem activado." : "Ítem desactivado.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "No se pudo cambiar el ítem.",
    };
  }
}

export async function eliminarLaboratorio(id: string): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Laboratorio inválido." };

  try {
    const supabase = createAdminClient();

    // Las auditorías tienen FK `on delete restrict`: se eliminan primero y sus
    // equipos y respuestas caen en cascada. Luego el laboratorio borra sus
    // computadoras en cascada.
    const { error: auditoriasError } = await supabase
      .from("auditorias_computo")
      .delete()
      .eq("laboratorio_id", id);

    if (auditoriasError) {
      return { ok: false, error: auditoriasError.message };
    }

    const { data: eliminado, error } = await supabase
      .from("labs_computo")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!eliminado) {
      return { ok: false, error: "El laboratorio ya no existe." };
    }

    revalidar();
    return {
      ok: true,
      mensaje: "Laboratorio eliminado con sus computadoras y semanas.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el laboratorio.",
    };
  }
}

export async function eliminarComputadora(id: string): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Computadora inválida." };

  try {
    const supabase = createAdminClient();
    const { data: eliminada, error } = await supabase
      .from("computadoras")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!eliminada) {
      return { ok: false, error: "La computadora ya no existe." };
    }

    revalidar();
    return { ok: true, mensaje: "Computadora eliminada." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la computadora.",
    };
  }
}

export async function eliminarItem(id: string): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Ítem inválido." };

  try {
    const supabase = createAdminClient();
    const { data: eliminado, error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!eliminado) return { ok: false, error: "El ítem ya no existe." };

    revalidar();
    return { ok: true, mensaje: "Ítem eliminado." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el ítem.",
    };
  }
}

export async function actualizarLaboratorio(
  id: string,
  datos: { codigo: string; nombre: string; ubicacion: string }
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Laboratorio inválido." };

  const codigo = datos.codigo.trim();
  const nombre = datos.nombre.trim();
  const ubicacion = datos.ubicacion.trim();

  if (!codigo) return { ok: false, error: "Escribe el código del laboratorio." };
  if (nombre.length < 3) {
    return { ok: false, error: "Escribe el nombre del laboratorio." };
  }

  try {
    const supabase = createAdminClient();
    const { data: actualizado, error } = await supabase
      .from("labs_computo")
      .update({
        codigo,
        nombre,
        ubicacion: ubicacion || null,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "Ese código de laboratorio ya existe."
            : error.message,
      };
    }

    if (!actualizado) {
      return { ok: false, error: "El laboratorio ya no existe." };
    }

    revalidar();
    revalidatePath(`/panel/auditorias/computo/laboratorios/${id}`);
    return { ok: true, mensaje: "Laboratorio actualizado." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el laboratorio.",
    };
  }
}

export async function actualizarComputadora(
  id: string,
  laboratorioId: string,
  datos: { codigo: string; nombre: string; orden: number }
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Computadora inválida." };

  const codigo = datos.codigo.trim();
  const nombre = datos.nombre.trim();

  if (!codigo) {
    return { ok: false, error: "Escribe el código de la computadora." };
  }

  try {
    const supabase = createAdminClient();
    const { data: actualizada, error } = await supabase
      .from("computadoras")
      .update({
        codigo,
        nombre: nombre || null,
        orden: Number.isFinite(datos.orden) ? datos.orden : 0,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "Ese código ya existe en el laboratorio."
            : error.message,
      };
    }

    if (!actualizada) {
      return { ok: false, error: "La computadora ya no existe." };
    }

    revalidar();
    revalidatePath(`/panel/auditorias/computo/laboratorios/${laboratorioId}`);
    return { ok: true, mensaje: "Computadora actualizada." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la computadora.",
    };
  }
}

export async function actualizarItem(
  id: string,
  datos: { nombre: string; categoria: string; orden: number }
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Ítem inválido." };

  const nombre = datos.nombre.trim();
  const categoria = datos.categoria as Categoria;

  if (nombre.length < 2) {
    return { ok: false, error: "Escribe el nombre del ítem." };
  }

  if (!CATEGORIAS.includes(categoria)) {
    return { ok: false, error: "Selecciona Hardware o Software." };
  }

  try {
    const supabase = createAdminClient();
    const { data: actualizado, error } = await supabase
      .from("checklist_items")
      .update({
        nombre,
        categoria,
        orden: Number.isFinite(datos.orden) ? datos.orden : 0,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!actualizado) return { ok: false, error: "El ítem ya no existe." };

    revalidar();
    return { ok: true, mensaje: "Ítem actualizado." };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el ítem.",
    };
  }
}

/**
 * Abre la semana elegida en el asistente (laboratorio → trimestre → semana).
 *
 * Si la semana todavía no existe, crea solo la auditoría; equipos y respuestas
 * se guardan en una única revisión al abrir el detalle. Si ya existe, lleva a
 * su detalle. Así el checklist no necesita "generar" las diez semanas de golpe.
 */
export async function abrirSemana(formData: FormData) {
  const perfil = await exigirChecklist();

  const laboratorioId = texto(formData, "laboratorio_id");
  const trimestre = texto(formData, "trimestre") as Trimestre;
  const numeroSemana = Number.parseInt(texto(formData, "numero_semana"), 10);
  const anio = Number.parseInt(texto(formData, "anio"), 10);

  const volver = (mensaje?: string) => {
    const params = new URLSearchParams({ vista: "auditorias" });
    if (laboratorioId) params.set("lab", laboratorioId);
    if (TRIMESTRES.includes(trimestre)) params.set("trimestre", trimestre);
    if (mensaje) params.set("error", mensaje);
    return `/panel/auditorias/computo?${params.toString()}`;
  };

  if (!perfil) {
    redirect(volver("No autorizado."));
  }

  if (
    !laboratorioId ||
    !TRIMESTRES.includes(trimestre) ||
    !Number.isInteger(numeroSemana) ||
    numeroSemana < 1 ||
    numeroSemana > 10 ||
    !Number.isInteger(anio) ||
    anio < 2000 ||
    anio > 2100
  ) {
    redirect(volver("Selecciona un laboratorio, un trimestre y una semana."));
  }

  const irAlDetalle = (id: string) =>
    `/panel/auditorias/computo/${id}?lab=${laboratorioId}&trimestre=${trimestre}`;

  let destino = "";
  let error = "";

  try {
    const supabase = createAdminClient();

    const { data: existente } = await supabase
      .from("auditorias_computo")
      .select("id")
      .eq("laboratorio_id", laboratorioId)
      .eq("anio", anio)
      .eq("trimestre", trimestre)
      .eq("numero_semana", numeroSemana)
      .maybeSingle();

    if (existente) {
      destino = irAlDetalle(existente.id);
    } else {
      const [
        { data: laboratorio },
        { data: computadoras },
        { data: items },
        { data: ancla },
      ] = await Promise.all([
        supabase
          .from("labs_computo")
          .select("id")
          .eq("id", laboratorioId)
          .eq("activo", true)
          .maybeSingle(),
        supabase
          .from("computadoras")
          .select("id")
          .eq("laboratorio_id", laboratorioId)
          .eq("activo", true),
        supabase.from("checklist_items").select("id").eq("activo", true),
        supabase
          .from("auditorias_computo")
          .select("semana_inicio")
          .eq("laboratorio_id", laboratorioId)
          .eq("anio", anio)
          .eq("trimestre", trimestre)
          .eq("numero_semana", 1)
          .maybeSingle(),
      ]);

      if (!laboratorio) {
        error = "El laboratorio no existe o está inactivo.";
      } else if (!computadoras || computadoras.length === 0) {
        error = "El laboratorio no tiene computadoras activas.";
      } else if (!items || items.length === 0) {
        error = "No hay ítems de checklist activos.";
      } else {
        const inicio = ancla?.semana_inicio ?? inicioTrimestre(trimestre, anio);
        const semanaInicio = sumarDias(inicio, (numeroSemana - 1) * 7);

        const { data: creada, error: errorInsert } = await supabase
          .from("auditorias_computo")
          .insert({
            laboratorio_id: laboratorioId,
            anio,
            trimestre,
            numero_semana: numeroSemana,
            semana_inicio: semanaInicio,
            auditor_id: perfil.id,
            estado: "borrador",
          })
          .select("id")
          .single();

        if (errorInsert || !creada) {
          if (errorInsert?.code === "23505") {
            const { data: otra } = await supabase
              .from("auditorias_computo")
              .select("id")
              .eq("laboratorio_id", laboratorioId)
              .eq("anio", anio)
              .eq("trimestre", trimestre)
              .eq("numero_semana", numeroSemana)
              .maybeSingle();

            if (otra) destino = irAlDetalle(otra.id);
            else error = "Ya existe una semana con esa fecha.";
          } else {
            error = errorInsert?.message ?? "No se pudo crear la semana.";
          }
        } else {
          revalidar(creada.id);
          destino = irAlDetalle(creada.id);
        }
      }
    }
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "No se pudo abrir la semana.";
  }

  if (destino) {
    redirect(destino);
  }

  redirect(volver(error || "No se pudo abrir la semana."));
}

type EquipoEntrada = {
  computadoraId: string;
  observacionHardware: string;
  observacionSoftware: string;
};

type RespuestaEntrada = {
  computadoraId: string;
  itemId: string;
  estado: string;
};

async function guardarRevisionInterno(
  supabase: ReturnType<typeof createAdminClient>,
  auditoriaId: string,
  equipos: EquipoEntrada[],
  respuestas: RespuestaEntrada[],
  observaciones: string
): Promise<EstadoAccion> {
  const { data: auditoria } = await supabase
    .from("auditorias_computo")
    .select("estado, laboratorio_id")
    .eq("id", auditoriaId)
    .single();

  if (!auditoria) return { ok: false, error: "Auditoría no encontrada." };

  if (auditoria.estado === "completada") {
    return {
      ok: false,
      error: "La revisión está completada y ya no se puede editar.",
    };
  }

  const { data: computadoras } = await supabase
    .from("computadoras")
    .select("id")
    .eq("laboratorio_id", auditoria.laboratorio_id);

  const idsComputadoras = new Set(
    (computadoras ?? []).map((computadora) => computadora.id)
  );

  const filasEquipos = equipos.map((equipo) => {
    if (!idsComputadoras.has(equipo.computadoraId)) {
      throw new Error("Hay una computadora que no pertenece al laboratorio.");
    }

    return {
      auditoria_id: auditoriaId,
      computadora_id: equipo.computadoraId,
      observacion_hardware: equipo.observacionHardware.trim() || null,
      observacion_software: equipo.observacionSoftware.trim() || null,
    };
  });

  if (filasEquipos.length > 0) {
    const { error } = await supabase
      .from("auditoria_computo_equipos")
      .upsert(filasEquipos, {
        onConflict: "auditoria_id,computadora_id",
      });

    if (error) return { ok: false, error: error.message };
  }

  const filasRespuestas = [];

  for (const respuesta of respuestas) {
    if (!idsComputadoras.has(respuesta.computadoraId) || !respuesta.itemId) {
      return { ok: false, error: "Hay una respuesta inválida." };
    }

    if (!ESTADOS_RESPUESTA.includes(respuesta.estado as EstadoRespuesta)) {
      return { ok: false, error: "Hay un estado de ítem inválido." };
    }

    filasRespuestas.push({
      auditoria_id: auditoriaId,
      computadora_id: respuesta.computadoraId,
      item_id: respuesta.itemId,
      estado: respuesta.estado,
    });
  }

  // Guardamos todas las combinaciones computadora/ítem, incluso las que quedan
  // sin marcar (pendiente), para poder contar los problemas al completar.
  const clavesRecibidas = new Set(
    respuestas.map(
      (respuesta) => `${respuesta.computadoraId}:${respuesta.itemId}`
    )
  );

  const [{ data: items }, { data: computadorasActivas }] = await Promise.all([
    supabase.from("checklist_items").select("id").eq("activo", true),
    supabase
      .from("computadoras")
      .select("id")
      .eq("laboratorio_id", auditoria.laboratorio_id)
      .eq("activo", true),
  ]);

  for (const computadora of computadorasActivas ?? []) {
    for (const item of items ?? []) {
      if (!clavesRecibidas.has(`${computadora.id}:${item.id}`)) {
        filasRespuestas.push({
          auditoria_id: auditoriaId,
          computadora_id: computadora.id,
          item_id: item.id,
          estado: "pendiente",
        });
      }
    }
  }

  if (filasRespuestas.length > 0) {
    const { error } = await supabase
      .from("auditoria_computo_respuestas")
      .upsert(filasRespuestas, {
        onConflict: "auditoria_id,computadora_id,item_id",
      });

    if (error) return { ok: false, error: error.message };
  }

  const { error: obsError } = await supabase
    .from("auditorias_computo")
    .update({ observaciones: observaciones.trim() || null })
    .eq("id", auditoriaId);

  if (obsError) return { ok: false, error: obsError.message };

  return { ok: true, mensaje: "Revisión guardada." };
}

export async function guardarSemana(
  auditoriaId: string,
  equipos: EquipoEntrada[],
  respuestas: RespuestaEntrada[],
  observaciones: string
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  try {
    const supabase = createAdminClient();
    const resultado = await guardarRevisionInterno(
      supabase,
      auditoriaId,
      equipos,
      respuestas,
      observaciones
    );

    if (!resultado.ok) return resultado;

    revalidar(auditoriaId);
    return resultado;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la revisión.",
    };
  }
}

export async function completarSemana(
  auditoriaId: string,
  equipos: EquipoEntrada[],
  respuestas: RespuestaEntrada[],
  observaciones: string
): Promise<EstadoAccion> {
  const perfil = await exigirChecklist();
  if (!perfil) return { ok: false, error: "No autorizado." };

  try {
    const supabase = createAdminClient();

    const guardado = await guardarRevisionInterno(
      supabase,
      auditoriaId,
      equipos,
      respuestas,
      observaciones
    );

    if (!guardado.ok) return guardado;

    const { data: auditoria } = await supabase
      .from("auditorias_computo")
      .select("laboratorio_id, estado")
      .eq("id", auditoriaId)
      .single();

    if (!auditoria || auditoria.estado === "completada") {
      return { ok: false, error: "La revisión no está disponible." };
    }

    const { data: computadoras } = await supabase
      .from("computadoras")
      .select("id")
      .eq("laboratorio_id", auditoria.laboratorio_id)
      .eq("activo", true);

    const { data: items } = await supabase
      .from("checklist_items")
      .select("id")
      .eq("activo", true);

    if (!computadoras || computadoras.length === 0) {
      return { ok: false, error: "No hay computadoras activas en el laboratorio." };
    }

    if (!items || items.length === 0) {
      return { ok: false, error: "No hay ítems activos." };
    }

    const { data: respuestasActuales } = await supabase
      .from("auditoria_computo_respuestas")
      .select("computadora_id, item_id, estado")
      .eq("auditoria_id", auditoriaId);

    const marcados = new Set(
      (respuestasActuales ?? [])
        .filter((respuesta) => respuesta.estado === "ok")
        .map(
          (respuesta) => `${respuesta.computadora_id}:${respuesta.item_id}`
        )
    );

    let problemas = 0;

    for (const computadora of computadoras) {
      for (const item of items) {
        if (!marcados.has(`${computadora.id}:${item.id}`)) {
          problemas += 1;
        }
      }
    }

    const { error } = await supabase
      .from("auditorias_computo")
      .update({
        estado: "completada",
        completado_en: new Date().toISOString(),
        problemas,
      })
      .eq("id", auditoriaId);

    if (error) return { ok: false, error: error.message };

    revalidar(auditoriaId);
    return {
      ok: true,
      mensaje:
        problemas === 0
          ? "Semana completada sin problemas."
          : `Semana completada con ${problemas} problema(s).`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo completar la semana.",
    };
  }
}
