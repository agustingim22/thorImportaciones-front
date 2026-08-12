import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByIdOrSlug } from "@/lib/products";
import { ProductPurchase } from "@/components/ProductPurchase";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductByIdOrSlug(slug);
  if (!p) return { title: "Camiseta no encontrada" };
  return {
    title: p.team,
    description: p.description,
    openGraph: { title: p.team, description: p.description, images: p.imageUrl ? [p.imageUrl] : [] },
  };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const product = await getProductByIdOrSlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Migas */}
      <nav className="mb-6 font-mono text-xs text-thor-muted">
        <Link href="/camisetas" className="hover:text-thor-gold">
          Camisetas
        </Link>{" "}
        / <span className="text-thor-ink">{product.team}</span>
      </nav>

      <ProductPurchase product={product} />
    </div>
  );
}
