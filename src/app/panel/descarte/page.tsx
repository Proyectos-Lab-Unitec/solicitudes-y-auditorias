import { FiTrash2 } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";
import { requireModulo } from "@/lib/auth";

export const instant = false;

export const metadata = { title: "Descarte | Gestión de Laboratorios" };

export default async function DescartePage() {
  await requireModulo("descarte");

  return (
    <ModuloEnConstruccion
      icono={FiTrash2}
      titulo="Descarte de equipo"
      descripcion="Solicitud de baja de activos con generación de la carta y el formato AF-02."
    />
  );
}
