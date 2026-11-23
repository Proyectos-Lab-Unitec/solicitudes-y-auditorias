"use client";

import { useState } from "react";
import { FiAlertTriangle, FiDownload } from "react-icons/fi";
import {
  TRIMESTRES,
  formatearSemana,
  inicioSemanaDesde,
  inicioTrimestre,
  semanaActualDesde,
  trimestreActual,
  type Trimestre,
} from "@/lib/computo";

type Laboratorio = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
};

type Auditoria = {
  laboratorio_id: string;
  anio: number;
  trimestre: string;
  numero_semana: number;
};

type Modo = "resultados" | "plantilla";

const CLASE_CONTROL =
  "w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20";

export function DescargaExcelComputo({
  anio,
  configuracion,
  laboratorios,
  auditorias,
}: {
  anio: number;
  configuracion: Record<string, Record<string, string>>;
  laboratorios: Laboratorio[];
  auditorias: Auditoria[];
}) {
  function inicioDe(anioConsulta: number, trimestreConsulta: Trimestre) {
    return (
      configuracion[String(anioConsulta)]?.[trimestreConsulta] ??
      inicioTrimestre(trimestreConsulta, anioConsulta)
    );
  }

  const trimestreInicial = trimestreActual();
  const [anioTexto, setAnioTexto] = useState(String(anio));
  const [anioSeleccionado, setAnioSeleccionado] = useState(anio);
  const [trimestre, setTrimestre] = useState<Trimestre>(trimestreInicial);
  const [semana, setSemana] = useState(() =>
    semanaActualDesde(inicioDe(anio, trimestreInicial))
  );
  const [modo, setModo] = useState<Modo>("resultados");

  function cambiarAnio(valor: string) {
    setAnioTexto(valor);

    const nuevoAnio = Number.parseInt(valor, 10);
    if (
      Number.isInteger(nuevoAnio) &&
      nuevoAnio >= 2000 &&
      nuevoAnio <= 2100
    ) {
      setAnioSeleccionado(nuevoAnio);
      setSemana(semanaActualDesde(inicioDe(nuevoAnio, trimestre)));
    }
  }

  const activos = laboratorios.filter((lab) => lab.activo);

  const faltan = activos.filter(
    (lab) =>
      !auditorias.some(
        (auditoria) =>
          auditoria.laboratorio_id === lab.id &&
          auditoria.anio === anioSeleccionado &&
          auditoria.trimestre === trimestre &&
          auditoria.numero_semana === semana
      )
  );

  const rango = formatearSemana(
    inicioSemanaDesde(inicioDe(anioSeleccionado, trimestre), semana)
  );

  return (
    <section className="rounded-xl border border-borde bg-tarjeta p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Reporte
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-texto">
            Descargar checklist en Excel
          </h2>
          <p className="mt-1 text-sm text-tenue">
            Un archivo con una hoja por laboratorio activo. Rango seleccionado:{" "}
            {trimestre} {anioSeleccionado} · Semana {semana} ({rango}).
          </p>
        </div>
        <span className="etiqueta-tecnica rounded-md border border-borde bg-superficie-clara px-2 py-1 text-[9px] text-tenue">
          {activos.length} laboratorio(s) activo(s)
        </span>
      </div>

      <form
        action="/api/auditorias/computo/excel"
        method="get"
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
      >
        <input type="hidden" name="trimestre" value={trimestre} />
        <input type="hidden" name="semana" value={semana} />

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tenue">
            Año
          </span>
          <input
            type="number"
            name="anio"
            min={2000}
            max={2100}
            required
            value={anioTexto}
            onChange={(evento) => cambiarAnio(evento.target.value)}
            className={CLASE_CONTROL}
            aria-label="Año del reporte"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tenue">
            Trimestre
          </span>
          <select
            value={trimestre}
            onChange={(evento) => {
              const nuevoTrimestre = evento.target.value as Trimestre;
              setTrimestre(nuevoTrimestre);
              setSemana(
                semanaActualDesde(inicioDe(anioSeleccionado, nuevoTrimestre))
              );
            }}
            className={CLASE_CONTROL}
            aria-label="Trimestre del reporte"
          >
            {TRIMESTRES.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-tenue">
            Semana
          </span>
          <select
            name="semana"
            value={semana}
            onChange={(evento) => setSemana(Number(evento.target.value))}
            className={CLASE_CONTROL}
            aria-label="Semana del reporte"
          >
            {Array.from({ length: 10 }, (_, indice) => indice + 1).map(
              (numero) => (
                <option key={numero} value={numero}>
                  Semana {numero}
                </option>
              )
            )}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-tenue">
            Contenido
          </span>
          <select
            name="modo"
            value={modo}
            onChange={(evento) => setModo(evento.target.value as Modo)}
            className={CLASE_CONTROL}
            aria-label="Contenido del Excel"
          >
            <option value="resultados">Resultados guardados</option>
            <option value="plantilla">Plantilla en blanco</option>
          </select>
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-superficie-azul px-4 text-sm font-semibold text-white transition-colors hover:bg-acento"
        >
          <FiDownload className="size-4" />
          Descargar Excel
        </button>
      </form>

      {activos.length > 0 && faltan.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <FiAlertTriangle className="size-4 shrink-0 text-amber-600" />
            Faltan registros para {trimestre} {anioSeleccionado} · Semana{" "}
            {semana}
          </p>
          <p className="mt-1 text-amber-800">
            Los siguientes laboratorios activos todavía no tienen revisión
            registrada para esa semana:
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {faltan.map((lab) => (
              <li
                key={lab.id}
                className="rounded-md border border-amber-200 bg-white px-2 py-1 text-xs font-medium text-amber-900"
              >
                {lab.codigo} · {lab.nombre}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            El Excel se generará de todos modos; esas hojas saldrán como
            plantilla.
          </p>
        </div>
      )}
    </section>
  );
}
