import { FiTool } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";

export const metadata = { title: "Mantenimiento | Gestión de Laboratorios" };

export default function MantenimientoPage() {
  return (
    <ModuloEnConstruccion
      icono={FiTool}
      titulo="Mantenimiento"
      descripcion="Solicitudes preventivas y correctivas, órdenes de trabajo, evidencias y cierre."
    />
  );
}
