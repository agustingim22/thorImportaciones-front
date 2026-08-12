import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByIdOrSlug } from "@/lib/products";
import { AddToCartButton } from "@/components/AddToCartButton";

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

  const isRetro = product.type === "retro";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Migas */}
      <nav className="mb-6 font-mono text-xs text-thor-muted">
        <Link href="/camisetas" className="hover:text-thor-gold">
          Camisetas
        </Link>{" "}
        / <span className="text-thor-ink">{product.team}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.35fr_1fr]">
        {/* Imagen */}
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-thor-line bg-thor-cream-2 p-6">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.team}
              className="max-h-[640px] w-full rounded-xl object-contain"
            />
          ) : (
            <div
              className="jersey-shape flex h-[420px] w-[380px] items-center justify-center"
              style={{ background: product.colorCss }}
            >
              <span className="font-display text-9xl text-thor-ink/80">{product.number}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="w-fit rounded-md border border-thor-line bg-thor-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-thor-ink-soft">
            {isRetro ? "Retro Fan" : "Player Version"}
          </span>

          <h1 className="mt-3 font-display text-3xl leading-tight tracking-wide text-thor-ink sm:text-4xl">
            {product.team}
          </h1>
          <p className="mt-1.5 font-mono text-xs text-thor-muted">{product.fabric}</p>

          <div className="mt-4 rounded-xl border border-thor-line bg-thor-paper px-4 py-3">
            <p className="font-display text-2xl text-thor-gold">
              ${product.price.toLocaleString("es-AR")}
            </p>
            <p className="mt-1.5 text-sm leading-snug text-thor-ink-soft">{product.description}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {product.inStock ? (
              <AddToCartButton
                item={{
                  productId: product.id,
                  team: product.team,
                  price: product.price,
                  imageUrl: product.imageUrl,
                  colorCss: product.colorCss,
                  number: product.number,
                }}
              />
            ) : (
              <span className="rounded-lg border border-thor-line px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-thor-muted">
                Sin stock
              </span>
            )}
            <Link
              href="/talles"
              className="font-mono text-xs text-thor-muted underline decoration-thor-line underline-offset-4 hover:text-thor-gold"
            >
              Ver guía de talles
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-thor-line bg-thor-cream-2 p-5">
            <p className="text-sm text-thor-ink-soft">
              ¿La querés con otro número, nombre o parche?
            </p>
            <Link
              href="/pedido-personalizado"
              className="mt-3 inline-block rounded-lg bg-thor-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-thor-cream hover:bg-thor-ink-soft"
            >
              Pedila personalizada →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
