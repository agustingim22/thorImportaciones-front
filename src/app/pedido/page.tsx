import type { Metadata } from "next";
import { PedidoTracker } from "@/components/PedidoTracker";

export const metadata: Metadata = {
  title: "Seguí tu pedido",
  robots: { index: false, follow: false },
};

export default function PedidoPage() {
  return <PedidoTracker />;
}
