import { FiTool } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";
import { requireModulo } from "@/lib/auth";

export const instant = false;

export const metadata = { title: "Mantenimiento | Gestión de Laboratorios" };

export default async function MantenimientoPage() {
  await requireModulo("mantenimiento");

  return (
    <ModuloEnConstruccion
      icono={FiTool}
      titulo="Mantenimiento"
      descripcion="Solicitudes preventivas y correctivas, órdenes de trabajo, evidencias y cierre."
    />
  );
}
