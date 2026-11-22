import type { IconType } from "react-icons";

export function ModuloEnConstruccion({
  titulo,
  descripcion,
  icono: Icono,
}: {
  titulo: string;
  descripcion: string;
  icono: IconType;
}) {
  return (
    <section className="rounded-xl border border-borde bg-tarjeta p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-superficie-clara text-acento ring-1 ring-borde">
          <Icono className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="etiqueta-tecnica text-[9px] text-acento">
            Módulo / Próximamente
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-texto">
            {titulo}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-tenue">
            {descripcion}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-borde-fuerte bg-superficie-clara p-8 text-center">
        <p className="etiqueta-tecnica text-[9px] text-tenue">En preparación</p>
        <p className="mt-2 text-sm font-semibold text-texto">
          Este módulo está en la siguiente fase
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-tenue">
          La estructura del panel ya está lista. Cuando se habilite, aparecerá
          aquí con su flujo completo.
        </p>
      </div>
    </section>
  );
}
