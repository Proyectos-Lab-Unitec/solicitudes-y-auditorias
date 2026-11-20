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
    <section className="rounded-2xl bg-tarjeta p-6 shadow-sm ring-1 ring-borde sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-superficie-clara text-acento">
          <Icono className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-acento uppercase">
            Próximamente
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-texto">
            {titulo}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-tenue">
            {descripcion}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-borde bg-superficie-clara p-8 text-center">
        <p className="text-sm font-semibold text-texto">
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
