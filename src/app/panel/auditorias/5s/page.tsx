import { FiCheckSquare } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";
import { requireModulo } from "@/lib/auth";

export const instant = false;

export const metadata = { title: "Auditorías 5S | Gestión de Laboratorios" };

export default async function Auditorias5SPage() {
  await requireModulo("auditorias-5s");

  return (
    <ModuloEnConstruccion
      icono={FiCheckSquare}
      titulo="Auditorías 5S"
      descripcion="Plantilla con cinco pasos, criterios editables, puntaje sobre 100%, hallazgos y reporte."
    />
  );
}
