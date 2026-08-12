import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByIdOrSlug } from "@/lib/products";
import { ProductPurchase } from "@/components/ProductPurchase";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductByIdOrSlug(slug);
  if (!p) return { title: "Camiseta no encontrada" };
  const typeLabel = p.type === "retro" ? "Retro" : p.type === "player" ? "Player Version" : "";
  return {
    title: p.team,
    description: p.description,
    keywords: [p.team, "camiseta de fútbol", typeLabel].filter(Boolean),
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: {
      title: p.team,
      description: p.description,
      url: `/producto/${p.slug}`,
      images: p.images.length > 0 ? p.images : undefined,
    },
  };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const product = await getProductByIdOrSlug(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.team,
    description: product.description,
    image: product.images,
    url: `${SITE_URL}/producto/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/producto/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
