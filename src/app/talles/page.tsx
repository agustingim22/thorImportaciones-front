import type { Metadata } from "next";
import { TallesGuide } from "@/components/TallesGuide";

export const metadata: Metadata = {
  title: "Guía de talles",
  description:
    "Tabla de talles para camisetas de fútbol, NBA, rugby, remeras, conjuntos deportivos y pantalones: medidas exactas por prenda.",
  alternates: { canonical: "/talles" },
};

// La categoría inicial viene de ?cat=… (la usan los links desde las fichas de producto). Se lee acá, en el
// servidor, para que toda la guía llegue ya armada en el HTML.
export default async function TallesPage(props: PageProps<"/talles">) {
  const sp = await props.searchParams;
  const cat = Array.isArray(sp.cat) ? sp.cat[0] : sp.cat;
  return <TallesGuide initialCategory={cat ?? null} />;
}
