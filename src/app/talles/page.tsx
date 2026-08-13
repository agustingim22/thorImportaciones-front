import type { Metadata } from "next";
import { TallesGuide } from "@/components/TallesGuide";

export const metadata: Metadata = {
  title: "Guía de talles",
  description:
    "Tabla de talles para camisetas de fútbol, NBA, rugby, remeras, conjuntos deportivos y pantalones: medidas exactas por prenda.",
  alternates: { canonical: "/talles" },
};

export default function TallesPage() {
  return <TallesGuide />;
}
