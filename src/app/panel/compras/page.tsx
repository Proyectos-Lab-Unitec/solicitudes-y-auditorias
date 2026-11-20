import { FiShoppingCart } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";

export const metadata = { title: "Compras | Gestión de Laboratorios" };

export default function ComprasPage() {
  return (
    <ModuloEnConstruccion
      icono={FiShoppingCart}
      titulo="Solicitudes de compra"
      descripcion="Catálogo de ítems, solicitud con justificación, cotizaciones y seguimiento hasta la compra."
    />
  );
}
