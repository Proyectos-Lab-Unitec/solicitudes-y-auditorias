"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { coincideComputadora } from "@/lib/computo";

export type ComputadoraBuscable = {
  id: string;
  codigo: string;
  nombre: string | null;
};

type ContextoBusqueda = {
  busqueda: string;
  setBusqueda: (valor: string) => void;
  computadoras: ComputadoraBuscable[];
  coincide: (computadora: ComputadoraBuscable) => boolean;
};

const Contexto = createContext<ContextoBusqueda | null>(null);

export function ProveedorBusquedaComputadoras({
  computadoras,
  children,
}: {
  computadoras: ComputadoraBuscable[];
  children: ReactNode;
}) {
  const [busqueda, setBusqueda] = useState("");

  const coincide = useMemo(
    () => (computadora: ComputadoraBuscable) =>
      coincideComputadora(computadora, busqueda),
    [busqueda]
  );

  return (
    <Contexto.Provider value={{ busqueda, setBusqueda, computadoras, coincide }}>
      {children}
    </Contexto.Provider>
  );
}

export function useBusquedaComputadoras() {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error(
      "El buscador debe usarse dentro de ProveedorBusquedaComputadoras."
    );
  }

  return contexto;
}

export function BuscadorComputadoras() {
  const { busqueda, setBusqueda, computadoras, coincide } =
    useBusquedaComputadoras();
  const coincidentes = computadoras.filter(coincide).length;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-borde bg-tarjeta px-4 py-3">
      <div className="relative min-w-[220px] flex-1">
        <FiSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tenue" />
        <input
          type="text"
          inputMode="search"
          role="searchbox"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar computadora: código o nombre (ej. 24)"
          aria-label="Buscar computadora por código o nombre"
          className="w-full rounded-lg border border-borde bg-white py-2.5 pr-10 pl-9 text-sm text-texto outline-none transition placeholder:text-tenue/70 focus:border-superficie-azul focus:ring-2 focus:ring-superficie-azul/20"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            aria-label="Limpiar búsqueda"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-tenue transition hover:bg-superficie-clara hover:text-texto"
          >
            <FiX className="size-4" />
          </button>
        )}
      </div>

      <span className="etiqueta-tecnica text-[9px] text-tenue">
        {busqueda
          ? `${coincidentes} de ${computadoras.length} computadora(s)`
          : `${computadoras.length} computadora(s) en la semana`}
      </span>
    </div>
  );
}
