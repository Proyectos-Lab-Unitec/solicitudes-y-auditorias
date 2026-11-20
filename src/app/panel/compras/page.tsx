import { FiShoppingCart } from "react-icons/fi";
import { ModuloEnConstruccion } from "@/components/modulo-en-construccion";
import { requireModulo } from "@/lib/auth";

export const metadata = { title: "Compras | Gestión de Laboratorios" };

export default async function ComprasPage() {
  await requireModulo("compras");

  return (
    <ModuloEnConstruccion
      icono={FiShoppingCart}
      titulo="Solicitudes de compra"
      descripcion="Catálogo de ítems, solicitud con justificación, cotizaciones y seguimiento hasta la compra."
    />
  );
}
