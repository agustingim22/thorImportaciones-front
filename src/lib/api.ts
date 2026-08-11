/**
 * Tipos compartidos (seguros para usar en cliente y servidor).
 * Los datos se obtienen con Prisma en Server Components (ver lib/products.ts)
 * y con route handlers (/api/...) desde componentes de cliente.
 */
export type Product = {
  id: number;
  slug: string;
  team: string;
  type: "retro" | "player";
  number: number;
  price: number;
  fabric: string;
  colorCss: string;
  imageUrl: string | null;
  description: string;
  inStock: boolean;
  createdAt: string;
};
