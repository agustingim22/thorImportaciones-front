import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByIdOrSlug, getRelatedProducts } from "@/lib/products";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { getPublishedTestimonials } from "@/lib/testimonials";
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

  let related: Awaited<ReturnType<typeof getRelatedProducts>> = [];
  try {
    related = await getRelatedProducts(product);
  } catch {
    related = [];
  }

  let testimonials: Awaited<ReturnType<typeof getPublishedTestimonials>> = [];
  try {
    testimonials = await getPublishedTestimonials();
  } catch {
    testimonials = [];
  }

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
    <>
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

        {related.length > 0 && (
          <section className="mt-16 border-t border-thor-line pt-10">
            <h2 className="font-display text-2xl tracking-wide text-thor-ink">
              También te puede interesar
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-thor-line">
        <Testimonials testimonials={testimonials} />
      </div>
    </>
  );
}
