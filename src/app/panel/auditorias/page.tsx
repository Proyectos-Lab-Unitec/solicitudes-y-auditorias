import { FiClipboard } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";

export const metadata = { title: "Auditorías | Gestión de Laboratorios" };

export default function AuditoriasPage() {
  return (
    <ModuloEnConstruccion
      icono={FiClipboard}
      titulo="Auditorías"
      descripcion="Auditorías 5S, de seguridad y de cómputo, con criterios editables y reportes."
    />
  );
}
