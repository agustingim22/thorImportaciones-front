import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "retro-seleccion-1986",
    team: "Retro Selección 1986",
    type: "retro",
    presetNumber: "10",
    price: 42000,
    colorCss: "linear-gradient(160deg,#5CA0FF,#22488F)",
    description: "Camiseta retro de colección, corte holgado en poliéster clásico.",
    patches: {
      create: [
        { label: "Copa Libertadores 1986", imageUrl: "https://res.cloudinary.com/jgazc5io/image/upload/v1/thor/patches/placeholder-libertadores.png", extraPrice: 3000 },
      ],
    },
  },
  { slug: "retro-river-1996", team: "Retro River 1996", type: "retro", presetNumber: "7", price: 44000, colorCss: "linear-gradient(160deg,#F5F3EE,#B8B4A8)", description: "Reedición retro en poliéster clásico, ideal para fanáticos y colección." },
  { slug: "retro-boca-2000", team: "Retro Boca 2000", type: "retro", presetNumber: "5", price: 44000, colorCss: "linear-gradient(160deg,#3D5AFE,#141C6B)", description: "Clásico de los 2000, tela poliéster con caída holgada." },
  { slug: "fan-seleccion-24", team: "Versión Fan Selección 23/24", type: "fan", price: 48000, colorCss: "linear-gradient(160deg,#7FD8C4,#1E6F5C)", description: "Versión fan, corte cómodo en poliéster liviano." },
  { slug: "player-local-23-24", team: "Player Local 23/24", type: "player", presetNumber: "9", price: 58000, colorCss: "linear-gradient(160deg,#FFB800,#C98E00)", description: "Versión jugador slim fit, tela dry-fit igual a la de cancha." },
  { slug: "player-visitante-23-24", team: "Player Visitante 23/24", type: "player", presetNumber: "11", price: 58000, colorCss: "linear-gradient(160deg,#1F2430,#0E1116)", description: "Versión jugador, corte ajustado y tela técnica premium." },
  { slug: "player-seleccion-nacional", team: "Player Selección Nacional", type: "player", presetNumber: "1", price: 61000, colorCss: "linear-gradient(160deg,#7FD8C4,#1E6F5C)", description: "Versión jugador de la selección, dry-fit premium." },
];

const count = await prisma.product.count();
if (count === 0) {
  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log(`Seed: ${products.length} productos insertados.`);
} else {
  console.log(`Seed: ya había ${count} productos, no se hace nada.`);
}

await prisma.$disconnect();
