# Thor Importaciones

Tienda de camisetas de fútbol (retro y versión jugador), **full-stack en Next.js**.

- **Frontend + backend en un solo proyecto** (Next.js 16, App Router, TypeScript).
- **Base de datos**: PostgreSQL con **Prisma** (ORM).
- **Imágenes**: Cloudinary. **Pagos**: Mercado Pago (Checkout Pro).

> El backend antes estaba en un proyecto aparte de C# (.NET). Se migró todo acá.

## Requisitos

- **Node 20+** (con nvm: `nvm use 22`).
- **Docker** (para la base de datos en desarrollo).

## Puesta en marcha

```bash
# 1) Base de datos
docker compose up -d

# 2) Variables de entorno
#    copiá .env.example → .env (DATABASE_URL) y → .env.local (secretos)

# 3) Dependencias, migraciones y datos de ejemplo
npm install
npx prisma migrate dev
npm run db:seed

# 4) Arrancar
npm run dev        # http://localhost:3000
```

- **Tienda**: http://localhost:3000
- **Panel admin**: http://localhost:3000/admin (token = `ADMIN_TOKEN` del `.env.local`)

## Variables de entorno (ver `.env.example`)

| Variable | Para qué | Dónde |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | `.env` |
| `ADMIN_TOKEN` | Acceso al panel admin | `.env.local` |
| `CLOUDINARY_URL` | Subida de fotos | `.env.local` |
| `MERCADOPAGO_ACCESS_TOKEN` | Cobros (TEST-… o APP_USR-…) | `.env.local` |
| `NEXT_PUBLIC_APP_URL` | URL pública (back_urls de MP) | `.env.local` |

Ningún secreto se commitea (`.env` y `.env.local` están en `.gitignore`).

## Estructura

```
src/
├─ app/
│  ├─ (páginas)              # home, camisetas, carrito, checkout, admin, etc.
│  └─ api/                   # route handlers (backend): products, orders, admin, webhooks
├─ components/               # UI (Nav, ProductCard, AdminDashboard, …)
└─ lib/
   ├─ prisma.ts              # cliente Prisma
   ├─ products.ts            # datos para Server Components
   ├─ cart.tsx               # carrito (context + localStorage)
   └─ server/                # helpers server-only (auth, cloudinary, mercadopago, …)
prisma/
├─ schema.prisma            # modelo de datos
└─ migrations/              # migraciones
```

## Seguridad

- Los **precios se recalculan siempre en el servidor** (el cliente solo manda producto + cantidad).
- El panel admin va detrás de token; endpoints de admin protegidos.
- Secretos en variables de entorno; nunca en el código.
- Prisma evita inyección SQL (consultas parametrizadas).
