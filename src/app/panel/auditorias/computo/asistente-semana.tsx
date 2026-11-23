import Link from "next/link";
import type { ReactNode } from "react";
import {
  CLASE_AUDITORIA,
  ETIQUETA_AUDITORIA,
  TRIMESTRES,
  formatearSemanaCorta,
  type EstadoAuditoria,
  type Trimestre,
} from "@/lib/computo";
import { abrirSemana } from "./actions";

const CLASE_TILE =
  "flex h-full w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition";

type Laboratorio = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
};

type Semana = {
  numero: number;
  inicio: string;
  auditoria: {
    id: string;
    estado: EstadoAuditoria;
  } | null;
};

function hrefAsistente(
  lab: string,
  trimestre: Trimestre | null,
  anio: number
) {
  const params = new URLSearchParams({ vista: "auditorias" });
  if (lab) params.set("lab", lab);
  if (trimestre) params.set("trimestre", trimestre);
  params.set("anio", String(anio));
  return `/panel/auditorias/computo?${params.toString()}`;
}

function PasoTitulo({
  numero,
  children,
}: {
  numero: number;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded-full bg-superficie-azul text-[10px] font-semibold text-white">
        {numero}
      </span>
      <span className="etiqueta-tecnica text-[9px] text-tenue">{children}</span>
    </p>
  );
}

function ContenidoSemana({
  semana,
  esChecklist,
}: {
  semana: Semana;
  esChecklist: boolean;
}) {
  return (
    <>
      <span
        className={`etiqueta-tecnica text-[9px] ${
          semana.auditoria ? "text-acento" : "text-tenue"
        }`}
      >
        Semana {semana.numero}
      </span>
      <span className="text-sm font-semibold text-texto">
        {formatearSemanaCorta(semana.inicio)}
      </span>

      {semana.auditoria ? (
        <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <span
            className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${
              CLASE_AUDITORIA[semana.auditoria.estado]
            }`}
          >
            {ETIQUETA_AUDITORIA[semana.auditoria.estado]}
          </span>
        </span>
      ) : (
        <span className="mt-auto pt-1 text-[10px] text-tenue">
          {esChecklist ? "+ Iniciar" : "Sin registrar"}
        </span>
      )}
    </>
  );
}

export function AsistenteSemana({
  laboratorios,
  labId,
  trimestre,
  anio,
  configuracion,
  semanas,
  esChecklist,
  computadorasActivas,
  itemsActivos,
  error,
}: {
  laboratorios: Laboratorio[];
  labId: string;
  trimestre: Trimestre | null;
  anio: number;
  configuracion: Record<
    string,
    { fecha_inicio: string; configurado: boolean }
  >;
  semanas: Semana[];
  esChecklist: boolean;
  computadorasActivas: number;
  itemsActivos: number;
  error?: string;
}) {
  const lab = laboratorios.find((item) => item.id === labId) ?? null;
  const puedeIniciar =
    esChecklist &&
    lab?.activo === true &&
    computadorasActivas > 0 &&
    itemsActivos > 0;

  return (
    <section className="rounded-xl border border-borde bg-tarjeta p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Revisión semanal
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-texto">
            {esChecklist ? "Registrar revisión" : "Consultar semana"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-tenue">
            {esChecklist
              ? "Elige el laboratorio, el trimestre y la semana. Los campos se cargan al abrir la semana."
              : "Elige el laboratorio, el trimestre y la semana para consultar su revisión."}
          </p>
        </div>
        <form
          method="get"
          action="/panel/auditorias/computo"
          className="flex items-end gap-2 rounded-lg border border-borde bg-tarjeta p-2"
        >
          <input type="hidden" name="vista" value="auditorias" />
          {labId && <input type="hidden" name="lab" value={labId} />}
          {trimestre && (
            <input type="hidden" name="trimestre" value={trimestre} />
          )}
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.08em] uppercase text-tenue">
              Año
            </span>
            <input
              type="number"
              name="anio"
              min={2000}
              max={2100}
              defaultValue={anio}
              aria-label="Año de la revisión"
              className="w-28 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold text-texto outline-none transition focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-borde bg-superficie-clara px-3 py-2 text-sm font-semibold text-texto transition hover:border-acento hover:bg-white"
          >
            Ir
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-5">
        <div>
          <PasoTitulo numero={1}>Laboratorio</PasoTitulo>

          {laboratorios.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-borde bg-superficie-clara p-4 text-sm text-tenue">
              No hay laboratorios registrados.{" "}
              {esChecklist && (
                <Link
                  href="/panel/auditorias/computo?vista=laboratorios"
                  className="font-semibold text-acento hover:text-superficie-azul"
                >
                  Agrega el primero
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {laboratorios.map((laboratorio) => {
                const activo = laboratorio.id === labId;

                return (
                  <Link
                    key={laboratorio.id}
                    href={hrefAsistente(laboratorio.id, trimestre, anio)}
                    className={`rounded-lg border px-3 py-2.5 transition ${
                      activo
                        ? "border-superficie-azul bg-superficie-azul text-white"
                        : "border-borde bg-tarjeta text-texto hover:border-acento hover:bg-superficie-clara"
                    }`}
                  >
                    <span
                      className={`etiqueta-tecnica block text-[9px] ${
                        activo ? "text-acento-claro" : "text-acento"
                      }`}
                    >
                      {laboratorio.codigo}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium">
                      {laboratorio.nombre}
                    </span>
                    {!laboratorio.activo && (
                      <span
                        className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          activo
                            ? "bg-white/15 text-white"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        Inactivo
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {lab && (
          <div>
            <PasoTitulo numero={2}>Trimestre</PasoTitulo>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TRIMESTRES.map((opcion) => {
                const activo = opcion === trimestre;
                const config = configuracion[opcion];

                return (
                  <Link
                    key={opcion}
                    href={hrefAsistente(lab.id, opcion, anio)}
                    className={`rounded-lg border px-3 py-2.5 text-center transition ${
                      activo
                        ? "border-superficie-azul bg-superficie-azul text-white"
                        : "border-borde bg-tarjeta text-texto hover:border-acento hover:bg-superficie-clara"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{opcion}</span>
                    <span
                      className={`mt-0.5 block text-[9px] font-medium ${
                        activo ? "text-acento-claro" : "text-tenue"
                      }`}
                    >
                      {config?.configurado ? "Configurado" : "Predeterminado"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {lab && trimestre && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PasoTitulo numero={3}>Semana</PasoTitulo>
              <span className="etiqueta-tecnica text-[9px] text-tenue">
                {computadorasActivas} computadora(s) · {itemsActivos} ítem(s)
              </span>
            </div>

            {esChecklist && !lab.activo && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Este laboratorio está inactivo.{" "}
                <Link
                  href="/panel/auditorias/computo?vista=laboratorios"
                  className="font-semibold underline"
                >
                  Actívalo
                </Link>{" "}
                para registrar semanas nuevas.
              </p>
            )}

            {esChecklist && computadorasActivas === 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Este laboratorio no tiene computadoras activas.{" "}
                <Link
                  href={`/panel/auditorias/computo/laboratorios/${lab.id}`}
                  className="font-semibold underline"
                >
                  Agrégalas
                </Link>
                .
              </p>
            )}

            {esChecklist && itemsActivos === 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No hay ítems activos.{" "}
                <Link
                  href="/panel/auditorias/computo?vista=items"
                  className="font-semibold underline"
                >
                  Agrega al menos uno
                </Link>
                .
              </p>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {semanas.map((semana) => {
                if (semana.auditoria) {
                  return (
                    <Link
                      key={semana.numero}
                      href={`/panel/auditorias/computo/${semana.auditoria.id}?lab=${lab.id}&trimestre=${trimestre}`}
                      className={`${CLASE_TILE} border-borde bg-tarjeta hover:border-acento hover:bg-superficie-clara`}
                    >
                      <ContenidoSemana
                        semana={semana}
                        esChecklist={esChecklist}
                      />
                    </Link>
                  );
                }

                if (!esChecklist) {
                  return (
                    <div
                      key={semana.numero}
                      className={`${CLASE_TILE} border-dashed border-borde bg-superficie-clara/40 text-tenue`}
                    >
                      <ContenidoSemana
                        semana={semana}
                        esChecklist={esChecklist}
                      />
                    </div>
                  );
                }

                return (
                  <form
                    key={semana.numero}
                    action={abrirSemana}
                    className="h-full"
                  >
                    <input
                      type="hidden"
                      name="laboratorio_id"
                      value={lab.id}
                    />
                    <input
                      type="hidden"
                      name="trimestre"
                      value={trimestre}
                    />
                    <input type="hidden" name="anio" value={anio} />
                    <input
                      type="hidden"
                      name="numero_semana"
                      value={semana.numero}
                    />
                    <button
                      type="submit"
                      disabled={!puedeIniciar}
                      className={`${CLASE_TILE} border-dashed border-borde bg-superficie-clara/60 hover:border-acento hover:bg-superficie-clara disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <ContenidoSemana
                        semana={semana}
                        esChecklist={esChecklist}
                      />
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
