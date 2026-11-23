import { connection } from "next/server";
import { getPerfilActual } from "@/lib/auth";
import {
  TRIMESTRES,
  inicioSemanaDesde,
  type Trimestre,
} from "@/lib/computo";
import {
  generarExcelComputo,
  type AuditoriaExcel,
  type ComputadoraExcel,
  type EquipoExcel,
  type ItemExcel,
  type LaboratorioExcel,
  type ModoExcelComputo,
  type RespuestaExcel,
} from "@/lib/excel-computo";
import { puedeVerModulo } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

function error(mensaje: string, status: number) {
  return Response.json({ error: mensaje }, { status });
}

export async function GET(request: Request) {
  await connection();

  const perfil = await getPerfilActual();
  if (!perfil || !perfil.activo) {
    return error("Inicia sesión con una cuenta activa.", 401);
  }

  if (!puedeVerModulo(perfil.rol, "auditorias-computo")) {
    return error("No tienes acceso a las auditorías de cómputo.", 403);
  }

  const url = new URL(request.url);
  const anio = Number(url.searchParams.get("anio"));
  const trimestre = url.searchParams.get("trimestre") ?? "";
  const semana = Number(url.searchParams.get("semana"));
  const modoParam = url.searchParams.get("modo") ?? "resultados";

  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return error("El año no es válido.", 400);
  }

  if (!(TRIMESTRES as readonly string[]).includes(trimestre)) {
    return error("El trimestre no es válido.", 400);
  }

  if (!Number.isInteger(semana) || semana < 1 || semana > 10) {
    return error("La semana debe estar entre 1 y 10.", 400);
  }

  if (modoParam !== "plantilla" && modoParam !== "resultados") {
    return error("El modo de exportación no es válido.", 400);
  }

  const modo = modoParam as ModoExcelComputo;
  const trimestreValidado = trimestre as Trimestre;
  const supabase = createAdminClient();

  const configRes = await supabase
    .from("trimestres_config")
    .select("fecha_inicio")
    .eq("anio", anio)
    .eq("trimestre", trimestreValidado)
    .maybeSingle();

  if (configRes.error) return error(configRes.error.message, 500);

  const labsRes = await supabase
    .from("labs_computo")
    .select("id, codigo, nombre")
    .eq("activo", true)
    .order("codigo");

  if (labsRes.error) return error(labsRes.error.message, 500);

  const laboratorios = (labsRes.data ?? []) as LaboratorioExcel[];
  const idsLaboratorios = laboratorios.map((lab) => lab.id);

  const itemsRes = await supabase
    .from("checklist_items")
    .select("id, nombre, categoria, orden")
    .eq("activo", true)
    .order("categoria")
    .order("orden");

  if (itemsRes.error) return error(itemsRes.error.message, 500);

  const items = (itemsRes.data ?? []) as ItemExcel[];

  let computadoras: ComputadoraExcel[] = [];
  let auditorias: AuditoriaExcel[] = [];
  let equipos: EquipoExcel[] = [];
  let respuestas: RespuestaExcel[] = [];

  if (idsLaboratorios.length > 0) {
    const computadorasRes = await supabase
      .from("computadoras")
      .select("id, laboratorio_id, codigo, nombre, orden")
      .in("laboratorio_id", idsLaboratorios)
      .eq("activo", true)
      .order("orden")
      .order("codigo");

    if (computadorasRes.error) return error(computadorasRes.error.message, 500);
    computadoras = (computadorasRes.data ?? []) as ComputadoraExcel[];

    const auditoriasRes = await supabase
      .from("auditorias_computo")
      .select(
        "id, laboratorio_id, anio, semana_inicio, trimestre, numero_semana, estado, observaciones"
      )
      .eq("anio", anio)
      .eq("trimestre", trimestreValidado)
      .eq("numero_semana", semana)
      .in("laboratorio_id", idsLaboratorios);

    if (auditoriasRes.error) return error(auditoriasRes.error.message, 500);
    auditorias = (auditoriasRes.data ?? []) as AuditoriaExcel[];

    const idsAuditorias = auditorias.map((auditoria) => auditoria.id);

    if (idsAuditorias.length > 0 && modo === "resultados") {
      const [equiposRes, respuestasRes] = await Promise.all([
        supabase
          .from("auditoria_computo_equipos")
          .select(
            "auditoria_id, computadora_id, observacion_hardware, observacion_software"
          )
          .in("auditoria_id", idsAuditorias),
        supabase
          .from("auditoria_computo_respuestas")
          .select("auditoria_id, computadora_id, item_id, estado")
          .in("auditoria_id", idsAuditorias),
      ]);

      if (equiposRes.error) return error(equiposRes.error.message, 500);
      if (respuestasRes.error) return error(respuestasRes.error.message, 500);

      equipos = (equiposRes.data ?? []) as EquipoExcel[];
      respuestas = (respuestasRes.data ?? []) as RespuestaExcel[];
    }
  }

  const archivo = await generarExcelComputo({
    modo,
    anio,
    trimestre: trimestreValidado,
    semana,
    semanaInicio: configRes.data?.fecha_inicio
      ? inicioSemanaDesde(configRes.data.fecha_inicio, semana)
      : undefined,
    laboratorios,
    computadoras,
    items,
    auditorias,
    equipos,
    respuestas,
  });

  const nombreArchivo = `checklist-computo-${trimestreValidado}-${anio}-S${semana}-${modo}.xlsx`;

  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
