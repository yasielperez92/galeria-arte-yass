import { createHash } from "node:crypto";
import { firebaseConfig } from "../../../firebase";

export const runtime = "nodejs";

const carpetaPermitida = "galeria-arte-yass";
const formatosPermitidos = {
  image: "jpg,jpeg,png,webp",
  raw: "mp3,m4a,wav,ogg,webm,aac,mp4",
} as const;

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return Response.json({ error: "Inicia sesión para subir archivos." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uidAdministrador = process.env.ADMIN_FIREBASE_UID;
  if (!cloudName || !apiKey || !apiSecret || !uidAdministrador) {
    return Response.json({ error: "El servicio de subida aún no está configurado en el servidor." }, { status: 503 });
  }

  try {
    const verificacion = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
      },
    );
    if (!verificacion.ok) {
      return Response.json({ error: "Tu sesión venció. Vuelve a iniciar sesión." }, { status: 401 });
    }

    const cuenta = await verificacion.json() as { users?: { localId?: string }[] };
    if (cuenta.users?.[0]?.localId !== uidAdministrador) {
      return Response.json({ error: "No tienes permiso para subir archivos." }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as { resourceType?: unknown } | null;
    if (body?.resourceType !== "image" && body?.resourceType !== "raw") {
      return Response.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
    }

    const resourceType = body.resourceType;
    const timestamp = Math.floor(Date.now() / 1000);
    const allowedFormats = formatosPermitidos[resourceType];
    const parametrosFirmados = `allowed_formats=${allowedFormats}&folder=${carpetaPermitida}&timestamp=${timestamp}`;
    const signature = createHash("sha1")
      .update(`${parametrosFirmados}${apiSecret}`)
      .digest("hex");

    return Response.json(
      {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder: carpetaPermitida,
        allowedFormats,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return Response.json({ error: "No se pudo autorizar la subida. Inténtalo de nuevo." }, { status: 500 });
  }
}
