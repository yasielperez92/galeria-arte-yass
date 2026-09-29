This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Análisis de obras con IA

La acción de análisis visual usa la API de OpenAI desde un Route Handler de Next.js. Copia `.env.example` a `.env.local` y coloca una clave de API válida en `OPENAI_API_KEY`. Crea la clave en [la plataforma API de OpenAI](https://platform.openai.com/api-keys). La clave se usa solo en el servidor y no debe añadirse al navegador ni al repositorio. El modelo predeterminado es `gpt-4.1-mini`; puedes cambiarlo con `OPENAI_VISION_MODEL`.

La API se factura por separado de la suscripción a ChatGPT; cada análisis puede generar cargos según el uso.

Esta app requiere un host que ejecute Next.js para procesar `/api/analizar-obra`; no despliegues solo la carpeta `out` como sitio estático.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
