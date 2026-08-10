# Thor Front (Next.js)

Front web de Thor Importaciones. Consume la API de C# (`../thor-backend`).

## Requisitos

- **Node 20+** — con nvm: `nvm use 22`. (Node 18 ya no es compatible con este stack.)

## Correr en desarrollo

```bash
nvm use 22
npm run dev      # http://localhost:3000
```

La API tiene que estar corriendo en paralelo (ver `../thor-backend/README.md`).

## Variables de entorno

Copiá `.env.example` a `.env.local` (ya está creado en desarrollo):

- `NEXT_PUBLIC_API_URL` — URL de la API. Por defecto `http://localhost:5184`.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 — tokens de marca Thor en `src/app/globals.css` (`thor-gold`, `thor-ink`, `thor-sky`…)

## Estructura

```
src/
├─ app/
│  ├─ layout.tsx      # metadata y layout raíz
│  ├─ page.tsx        # home provisoria (verifica la conexión con la API)
│  └─ globals.css     # Tailwind + paleta de marca
└─ lib/
   └─ api.ts          # cliente tipado de la API (Product, getProducts, getHealth)
```

## Próximo (Tramo 01)

Rebrand completo: logo real, tipografías, y recrear las páginas del prototipo
(`../prototipo-estatico/`) con la identidad Thor.
