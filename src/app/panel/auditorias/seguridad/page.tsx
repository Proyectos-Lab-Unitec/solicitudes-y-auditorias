import { FiShield } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";
import { requireModulo } from "@/lib/auth";

export const instant = false;

export const metadata = {
  title: "Auditorías de seguridad | Gestión de Laboratorios",
};

export default async function AuditoriasSeguridadPage() {
  await requireModulo("auditorias-seguridad");

  return (
    <ModuloEnConstruccion
      icono={FiShield}
      titulo="Auditorías de seguridad"
      descripcion="Catálogo de actos y condiciones inseguras, evaluación por riesgo, hallazgos y reporte."
    />
  );
}
