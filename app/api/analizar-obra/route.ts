import { firebaseConfig } from "../../../firebase";

export const runtime = "nodejs";

const maxImagenBytes = 8 * 1024 * 1024;
const formatosPermitidos = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return Response.json({ error: "Inicia sesión para analizar una obra." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxImagenBytes * 1.5) {
    return Response.json({ error: "La imagen debe pesar menos de 8 MB." }, { status: 413 });
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
    if (!verificacion.ok) return Response.json({ error: "Tu sesión venció. Vuelve a iniciar sesión." }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Falta configurar OPENAI_API_KEY en el servidor." }, { status: 503 });
    }

    const body = await request.json() as { imageDataUrl?: unknown };
    if (typeof body.imageDataUrl !== "string" || body.imageDataUrl.length > maxImagenBytes * 1.4) {
      return Response.json({ error: "La imagen debe pesar menos de 8 MB." }, { status: 413 });
    }

    const coincidencia = body.imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/);
    if (!coincidencia || !formatosPermitidos.has(coincidencia[1])) {
      return Response.json({ error: "Selecciona una imagen JPG, PNG o WEBP válida." }, { status: 400 });
    }
    const bytes = Buffer.from(coincidencia[2], "base64");
    if (bytes.byteLength > maxImagenBytes) {
      return Response.json({ error: "La imagen debe pesar menos de 8 MB." }, { status: 413 });
    }

    const respuesta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 260,
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analiza esta obra visual en español para proponer un borrador breve de descripción de galería. En dos apartados, 'Análisis formal' y 'Lectura conceptual', describe solo lo visible (composición, color, luz, formas, técnica aparente y atmósfera); presenta las interpretaciones como posibilidades y no inventes datos sobre el artista, el título, la época o la intención. Máximo 130 palabras. No añadas markdown ni introducciones.",
            },
            { type: "input_image", image_url: body.imageDataUrl, detail: "high" },
          ],
        }],
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    const datos = await respuesta.json() as { output_text?: string; error?: { message?: string } };
    if (!respuesta.ok) {
      console.error("OpenAI image analysis failed:", respuesta.status, datos.error?.message);
      return Response.json({ error: "No se pudo analizar la imagen. Revisa la configuración del servicio e inténtalo otra vez." }, { status: 502 });
    }
    if (!datos.output_text?.trim()) {
      return Response.json({ error: "El análisis no devolvió una descripción. Inténtalo de nuevo." }, { status: 502 });
    }

    return Response.json({ descripcion: datos.output_text.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error processing artwork analysis:", error);
    return Response.json({ error: "No se pudo completar el análisis. Inténtalo de nuevo." }, { status: 500 });
  }
}
