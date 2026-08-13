import type { Metadata } from "next";
import { FavoritosGrid } from "@/components/FavoritosGrid";

export const metadata: Metadata = {
  title: "Mis favoritos",
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return <FavoritosGrid />;
}
