import { FiTrash2 } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";

export const metadata = { title: "Descarte | Gestión de Laboratorios" };

export default function DescartePage() {
  return (
    <ModuloEnConstruccion
      icono={FiTrash2}
      titulo="Descarte de equipo"
      descripcion="Solicitud de baja de activos con generación de la carta y el formato AF-02."
    />
  );
}
