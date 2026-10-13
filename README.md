# Estudio de Arte Yass

Galería pública y panel de administración construidos con Next.js, Firebase y Cloudinary.

## Desarrollo local

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env.local`. Configura `OPENAI_API_KEY` solo si se usará el análisis de imágenes con IA, establece `ADMIN_FIREBASE_UID` con el UID de la cuenta administradora de Firebase y cambia `NEXT_PUBLIC_SITE_URL` por el dominio público al publicar. `NEXT_PUBLIC_ENABLE_AI_ANALYSIS` permanece en `false` hasta configurar la clave y el UID. Nunca añadas claves privadas al código ni al repositorio.

El análisis de imágenes requiere `OPENAI_API_KEY` y puede generar cargos de API. La ruta también exige una sesión válida de Firebase perteneciente al UID administrador.

## Seguridad de Firebase

Antes de publicar, despliega `firestore.rules` en Firebase Console o con Firebase CLI. Las reglas dejan la lectura pública de obras y del perfil, y permiten cambios únicamente a la cuenta cuyo UID se configura como administrador. No uses reglas abiertas en producción.

## Publicación

La aplicación necesita un host de Next.js (por ejemplo, Vercel); no publiques `out` como sitio estático porque el análisis de imágenes usa una ruta de servidor. Conecta el repositorio a Vercel y configura `ADMIN_FIREBASE_UID`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY` y `OPENAI_VISION_MODEL` en las variables de entorno del proyecto. Activa `NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true` solo después de configurar la clave de OpenAI; la clave es opcional si el análisis permanece desactivado.

El workflow de GitHub Actions ejecuta ESLint y la compilación de producción para cambios en `main` y pull requests.
