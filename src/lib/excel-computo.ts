import "server-only";

import ExcelJS from "exceljs";
import {
  formatearSemana,
  inicioSemana,
  type Trimestre,
} from "@/lib/computo";

export type ModoExcelComputo = "plantilla" | "resultados";

export type LaboratorioExcel = {
  id: string;
  codigo: string;
  nombre: string;
};

export type ComputadoraExcel = {
  id: string;
  laboratorio_id: string;
  codigo: string;
  nombre: string | null;
  orden: number;
};

export type ItemExcel = {
  id: string;
  nombre: string;
  categoria: string;
  orden: number;
};

export type AuditoriaExcel = {
  id: string;
  laboratorio_id: string;
  anio: number;
  trimestre: string;
  numero_semana: number;
  estado: string;
  semana_inicio: string;
  observaciones: string | null;
};

export type EquipoExcel = {
  auditoria_id: string;
  computadora_id: string;
  observacion_hardware: string | null;
  observacion_software: string | null;
};

export type RespuestaExcel = {
  auditoria_id: string;
  computadora_id: string;
  item_id: string;
  estado: string;
};

type DatosExcel = {
  modo: ModoExcelComputo;
  anio: number;
  trimestre: Trimestre;
  semana: number;
  /** Lunes configurado de la semana seleccionada. */
  semanaInicio?: string;
  laboratorios: LaboratorioExcel[];
  computadoras: ComputadoraExcel[];
  items: ItemExcel[];
  auditorias: AuditoriaExcel[];
  equipos: EquipoExcel[];
  respuestas: RespuestaExcel[];
};

const ARGB_TEXTO = "FF0A1633";
const ARGB_BLANCO = "FFFFFFFF";
const ARGB_ENCABEZADO = "FF0F49B6";
const ARGB_CLARO = "FFF6F8FC";
const ARGB_PROBLEMA = "FFFEE2E2";
const ARGB_ROJO = "FFB91C1C";
const ARGB_BORDE = "FF000000";

function borde() {
  const lado = { style: "thin" as const, color: { argb: ARGB_BORDE } };
  return {
    left: lado,
    right: lado,
    top: lado,
    bottom: lado,
  };
}

function relleno(argb: string) {
  return {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb },
    bgColor: { argb },
  };
}

function nombreHojaUnico(
  codigo: string,
  semana: number,
  usados: Set<string>
) {
  const base =
    `${codigo}-S${semana}`.replace(/[[\]:*?/\\]/g, "_").slice(0, 31) ||
    `S${semana}`;

  let nombre = base;
  let sufijo = 2;

  while (usados.has(nombre.toLowerCase())) {
    const texto = `-${sufijo++}`;
    nombre = `${base.slice(0, 31 - texto.length)}${texto}`;
  }

  usados.add(nombre.toLowerCase());
  return nombre;
}

function configurarPagina(hoja: ExcelJS.Worksheet) {
  hoja.views = [
    {
      state: "frozen",
      xSplit: 2,
      ySplit: 3,
      topLeftCell: "C4",
    },
  ];

  hoja.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    horizontalCentered: true,
    printTitlesRow: "1:3",
    printTitlesColumn: "A:B",
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };
}

function hojaSinLaboratorios(workbook: ExcelJS.Workbook) {
  const hoja = workbook.addWorksheet("Sin laboratorios");
  const celda = hoja.getCell("A1");

  celda.value =
    "No hay laboratorios de cómputo activos. Activa o crea un laboratorio para generar el checklist.";
  celda.font = { name: "Arial", size: 11, bold: true, color: { argb: ARGB_TEXTO } };
  celda.alignment = { vertical: "middle", wrapText: true };
  hoja.getColumn(1).width = 100;
  hoja.getRow(1).height = 36;
  configurarPagina(hoja);
}

export async function generarExcelComputo(
  datos: DatosExcel
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Solicitudes y Auditorías";
  workbook.created = new Date();

  if (datos.laboratorios.length === 0) {
    hojaSinLaboratorios(workbook);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  const hardware = datos.items
    .filter((item) => item.categoria === "Hardware")
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  const software = datos.items
    .filter((item) => item.categoria === "Software")
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));

  const auditoriaPorLab = new Map(
    datos.auditorias
      .filter(
        (auditoria) =>
          auditoria.anio === datos.anio &&
          auditoria.trimestre === datos.trimestre &&
          auditoria.numero_semana === datos.semana
      )
      .map((auditoria) => [auditoria.laboratorio_id, auditoria])
  );

  const equipoPorClave = new Map(
    datos.equipos.map((equipo) => [
      `${equipo.auditoria_id}:${equipo.computadora_id}`,
      equipo,
    ])
  );

  const respuestaPorClave = new Map(
    datos.respuestas.map((respuesta) => [
      `${respuesta.auditoria_id}:${respuesta.computadora_id}:${respuesta.item_id}`,
      respuesta.estado,
    ])
  );

  const usados = new Set<string>();
  const inicioCanonico =
    datos.semanaInicio ??
    inicioSemana(datos.trimestre, datos.anio, datos.semana);

  for (const laboratorio of datos.laboratorios) {
    const nombre = nombreHojaUnico(laboratorio.codigo, datos.semana, usados);
    const hoja = workbook.addWorksheet(nombre);
    const auditoria = auditoriaPorLab.get(laboratorio.id) ?? null;
    const computadoras = datos.computadoras
      .filter((computadora) => computadora.laboratorio_id === laboratorio.id)
      .sort((a, b) => a.orden - b.orden || a.codigo.localeCompare(b.codigo));

    const colComputadoraHardware = 2;
    const colItemsHardware = colComputadoraHardware + 1;
    const colObsHardware = colItemsHardware + hardware.length;
    const finObsHardware = colObsHardware + 1;
    const colComputadoraSoftware = finObsHardware + 2;
    const colItemsSoftware = colComputadoraSoftware + 1;
    const colObsSoftware = colItemsSoftware + software.length;
    const finObsSoftware = colObsSoftware + 1;
    const ultimaColumna = finObsSoftware;

    hoja.getColumn(1).width = 2.5;
    hoja.getColumn(colComputadoraHardware).width = 22;
    hoja.getColumn(colComputadoraSoftware).width = 22;

    for (let col = colItemsHardware; col < colObsHardware; col++) {
      hoja.getColumn(col).width = 15;
    }
    for (let col = colItemsSoftware; col < colObsSoftware; col++) {
      hoja.getColumn(col).width = 15;
    }
    for (const col of [colObsHardware, finObsHardware, colObsSoftware, finObsSoftware]) {
      hoja.getColumn(col).width = 18;
    }
    hoja.getColumn(finObsHardware + 1).width = 2.5;

    configurarPagina(hoja);

    const tituloBloques: Array<[number, number, string]> = [
      [colComputadoraHardware, finObsHardware, "HARDWARE"],
      [colComputadoraSoftware, finObsSoftware, "SOFTWARE"],
    ];

    for (const [inicio, fin, texto] of tituloBloques) {
      hoja.mergeCells(1, inicio, 1, fin);
      const celda = hoja.getCell(1, inicio);
      celda.value = texto;
      celda.font = {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: ARGB_BLANCO },
      };
      celda.fill = relleno(ARGB_ENCABEZADO);
      celda.alignment = { horizontal: "center", vertical: "middle" };
    }

    const rango = formatearSemana(auditoria?.semana_inicio ?? inicioCanonico);
    const subtitulo = `${datos.trimestre} ${datos.anio} · SEMANA ${datos.semana} · ${rango}`;

    for (const [inicio, fin] of [
      [colComputadoraHardware, finObsHardware],
      [colComputadoraSoftware, finObsSoftware],
    ]) {
      hoja.mergeCells(2, inicio, 2, fin);
      const celda = hoja.getCell(2, inicio);
      celda.value = subtitulo;
      celda.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: ARGB_TEXTO },
      };
      celda.fill = relleno(ARGB_CLARO);
      celda.alignment = { horizontal: "center", vertical: "middle" };
    }

    const encabezados = new Map<number, string>([
      [colComputadoraHardware, "COMPUTADORA"],
      [colObsHardware, "OBSERVACIÓN"],
      [colComputadoraSoftware, "COMPUTADORA"],
      [colObsSoftware, "OBSERVACIÓN"],
    ]);
    hardware.forEach((item, indice) => {
      encabezados.set(colItemsHardware + indice, item.nombre.toUpperCase());
    });
    software.forEach((item, indice) => {
      encabezados.set(colItemsSoftware + indice, item.nombre.toUpperCase());
    });

    for (let col = colComputadoraHardware; col <= ultimaColumna; col++) {
      const celda = hoja.getCell(3, col);
      celda.value = encabezados.get(col) ?? "";
      celda.font = {
        name: "Arial",
        size: 9,
        bold: true,
        color: { argb: ARGB_BLANCO },
      };
      celda.fill = relleno(ARGB_ENCABEZADO);
      celda.border = borde();
      celda.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }

    hoja.getRow(1).height = 24;
    hoja.getRow(2).height = 22;
    hoja.getRow(3).height = 34;

    const itemsPorBloque = [
      { computadora: colComputadoraHardware, items: hardware, inicio: colItemsHardware, obs: colObsHardware, finObs: finObsHardware, categoria: "hardware" },
      { computadora: colComputadoraSoftware, items: software, inicio: colItemsSoftware, obs: colObsSoftware, finObs: finObsSoftware, categoria: "software" },
    ];

    let totalOK = 0;
    const totalChecks = computadoras.length * (hardware.length + software.length);

    computadoras.forEach((computadora, indice) => {
      const fila = 4 + indice;
      const nombreComputadora = computadora.nombre || computadora.codigo;

      for (let col = colComputadoraHardware; col <= ultimaColumna; col++) {
        const celda = hoja.getCell(fila, col);
        celda.font = { name: "Arial", size: 10, color: { argb: ARGB_TEXTO } };
        celda.border = borde();
        celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      }

      const equipo = auditoria
        ? equipoPorClave.get(`${auditoria.id}:${computadora.id}`)
        : undefined;

      for (const bloque of itemsPorBloque) {
        hoja.getCell(fila, bloque.computadora).value = nombreComputadora;

        bloque.items.forEach((item, indiceItem) => {
          const celda = hoja.getCell(fila, bloque.inicio + indiceItem);
          const estado = auditoria
            ? respuestaPorClave.get(
                `${auditoria.id}:${computadora.id}:${item.id}`
              )
            : undefined;
          const esOK = datos.modo === "resultados" && estado === "ok";

          celda.value = esOK;
          celda.alignment = { horizontal: "center", vertical: "middle" };

          if (esOK) {
            totalOK++;
          } else if (datos.modo === "resultados") {
            celda.fill = relleno(ARGB_PROBLEMA);
            celda.font = {
              name: "Arial",
              size: 10,
              bold: true,
              color: { argb: ARGB_ROJO },
            };
          }
        });

        const observacion =
          bloque.categoria === "hardware"
            ? equipo?.observacion_hardware
            : equipo?.observacion_software;
        const celdaObs = hoja.getCell(fila, bloque.obs);
        celdaObs.value = datos.modo === "resultados" ? (observacion ?? "") : "";
        celdaObs.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        hoja.mergeCells(fila, bloque.obs, fila, bloque.finObs);
      }

      hoja.getRow(fila).height = 24;
    });

    const filaResumen = 4 + computadoras.length + 1;
    hoja.mergeCells(filaResumen, colComputadoraHardware, filaResumen, ultimaColumna);
    const celdaResumen = hoja.getCell(filaResumen, colComputadoraHardware);

    if (!auditoria) {
      celdaResumen.value = `SIN REVISIÓN REGISTRADA · Se exporta como plantilla · ${computadoras.length} computadora(s)`;
    } else if (datos.modo === "resultados") {
      celdaResumen.value = `RESUMEN · OK: ${totalOK}/${totalChecks} · Problemas: ${totalChecks - totalOK} · Estado: ${
        auditoria.estado === "completada" ? "Completada" : "Borrador"
      }`;
    } else {
      celdaResumen.value = `PLANTILLA · ${computadoras.length} computadora(s) · ${
        hardware.length + software.length
      } ítem(s)`;
    }

    celdaResumen.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: ARGB_TEXTO },
    };
    celdaResumen.fill = relleno(ARGB_CLARO);
    celdaResumen.alignment = { horizontal: "left", vertical: "middle" };
    hoja.getRow(filaResumen).height = 24;

    const filaObservaciones = filaResumen + 1;
    hoja.mergeCells(
      filaObservaciones,
      colComputadoraHardware,
      filaObservaciones,
      ultimaColumna
    );
    const celdaObservaciones = hoja.getCell(
      filaObservaciones,
      colComputadoraHardware
    );
    celdaObservaciones.value = `OBSERVACIONES DE LA SEMANA: ${
      datos.modo === "resultados" && auditoria?.observaciones
        ? auditoria.observaciones
        : "—"
    }`;
    celdaObservaciones.font = {
      name: "Arial",
      size: 10,
      color: { argb: ARGB_TEXTO },
    };
    celdaObservaciones.alignment = {
      horizontal: "left",
      vertical: "top",
      wrapText: true,
    };
    hoja.getRow(filaObservaciones).height = 44;
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
