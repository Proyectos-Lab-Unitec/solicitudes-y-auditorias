import {
  CLASE_RESPUESTA,
  ETIQUETA_RESPUESTA,
  type EstadoRespuesta,
} from "@/lib/computo";

export function BadgeRespuesta({ estado }: { estado: EstadoRespuesta }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase ring-1 ring-inset ${CLASE_RESPUESTA[estado]}`}
    >
      {ETIQUETA_RESPUESTA[estado]}
    </span>
  );
}
