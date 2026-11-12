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
import { clubHeading, clubPath, getClubBySlug } from "@/lib/clubs";
import { SITE_URL } from "@/lib/site";
import { productDescription } from "@/lib/seo";

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
  const description = productDescription(p);
  return {
    title: p.name,
    description,
    keywords: [p.name, PRODUCT_TYPE_LABELS[p.type]].filter(Boolean),
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
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
  // Si hay camisetas del mismo equipo entre las sugeridas, el título lo dice ("Más camisetas de River Plate").
  const clubInfo = getClubBySlug(product.club);
  const relatedClub = clubInfo && related.some((p) => p.club === clubInfo.slug) ? clubInfo : null;
  const testimonials = testimonialsResult.status === "fulfilled" ? testimonialsResult.value : [];
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const questions = questionsResult.status === "fulfilled" ? questionsResult.value : [];

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // Los productos importados vienen sin descripción: se muestra (y se manda a Google) una generada.
  const description = productDescription(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
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
      ...(clubInfo
        ? [{ "@type": "ListItem", position: 3, name: clubInfo.name, item: `${SITE_URL}${clubPath(clubInfo.slug)}` }]
        : []),
      {
        "@type": "ListItem",
        position: clubInfo ? 4 : 3,
        name: product.name,
        item: `${SITE_URL}/producto/${product.slug}`,
      },
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
          {clubInfo && (
            <>
              /{" "}
              <Link href={clubPath(clubInfo.slug)} className="hover:text-thor-gold">
                {clubInfo.name}
              </Link>{" "}
            </>
          )}
          / <span className="text-thor-ink">{product.name}</span>
        </nav>

        <ProductPurchase product={{ ...product, description }} />

        {related.length > 0 && (
          <section className="mt-16 border-t border-thor-line pt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl tracking-wide text-thor-ink">
                {relatedClub ? `Más camisetas de ${clubHeading(relatedClub)}` : "También te puede interesar"}
              </h2>
              {relatedClub && (
                <Link
                  href={clubPath(relatedClub.slug)}
                  className="font-mono text-xs font-bold uppercase tracking-wider text-thor-gold hover:underline"
                >
                  Ver todo →
                </Link>
              )}
            </div>
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
