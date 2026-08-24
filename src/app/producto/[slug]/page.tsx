import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProductByIdOrSlug, getRelatedProducts } from "@/lib/products";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { getProductReviews } from "@/lib/reviews";
import { ProductQuestions } from "@/components/ProductQuestions";
import { getProductQuestions } from "@/lib/questions";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Testimonials } from "@/components/Testimonials";
import { getPublishedTestimonials } from "@/lib/testimonials";
import { PRODUCT_TYPE_LABELS } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

// No lee cookies/headers: se sirve cacheada y se regenera en segundo plano
// (el stock/precio real siempre se valida de nuevo en el checkout).
export const revalidate = 60;

/** Prerenderiza todos los productos existentes en el build; los nuevos se
 *  generan on-demand en la primera visita y quedan cacheados igual. Si la
 *  base no responde durante el build, no tira abajo el deploy entero: todas
 *  las páginas de producto pasan a generarse on-demand igual que hoy. */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductByIdOrSlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.team,
    description: p.description,
    keywords: [p.team, PRODUCT_TYPE_LABELS[p.type]].filter(Boolean),
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

  // Las 4 consultas son independientes entre sí: se disparan en paralelo en vez
  // de una tras otra para no sumar 4 round-trips a la base de forma innecesaria.
  const [relatedResult, testimonialsResult, reviewsResult, questionsResult] =
    await Promise.allSettled([
      getRelatedProducts(product),
      getPublishedTestimonials(),
      getProductReviews(product.id),
      getProductQuestions(product.id),
    ]);

  const related = relatedResult.status === "fulfilled" ? relatedResult.value : [];
  const testimonials = testimonialsResult.status === "fulfilled" ? testimonialsResult.value : [];
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const questions = questionsResult.status === "fulfilled" ? questionsResult.value : [];

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.team,
    description: product.description,
    image: product.images,
    url: `${SITE_URL}/producto/${product.slug}`,
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/producto/${product.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE_URL}/catalogo` },
      { "@type": "ListItem", position: 3, name: product.team, item: `${SITE_URL}/producto/${product.slug}` },
    ],
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {/* Migas */}
        <nav className="mb-6 font-mono text-xs text-thor-muted">
          <Link href="/catalogo" className="hover:text-thor-gold">
            Catálogo
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

        <ProductQuestions productId={product.id} questions={questions} />
        <ProductReviews productId={product.id} reviews={reviews} />
      </div>

      <div className="border-t border-thor-line">
        <RecentlyViewed excludeId={product.id} />
        <Testimonials testimonials={testimonials} />
      </div>
    </>
  );
}
