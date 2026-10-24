"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ImageEditor from "./image-editor";
import {
  arrayRemove,
  arrayUnion,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  getFirestore,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import app from "../../firebase";

const db = getFirestore(app);
const auth = getAuth(app);
const artistDoc = doc(db, "configuracion", "artista");
const claveColeccionesLocales = "galeria-yass-colecciones";
function leerColeccionesLocales(): string[] {
  try { return JSON.parse(window.localStorage.getItem(claveColeccionesLocales) || "[]") as string[]; }
  catch { return []; }
}
function guardarColeccionesLocales(nombres: string[]) {
  try { window.localStorage.setItem(claveColeccionesLocales, JSON.stringify(nombres)); }
  catch { /* El navegador puede tener el almacenamiento local desactivado. */ }
}
type RedSocial = { nombre: string; url: string };
const redesDisponibles = [
  "Instagram", "Facebook", "X", "TikTok", "YouTube", "LinkedIn", "Pinterest", "Behance",
  "WhatsApp", "Telegram", "Discord", "Twitch", "Snapchat", "Reddit", "Threads", "Bluesky",
  "Spotify", "SoundCloud", "Vimeo", "Flickr", "Dribbble", "Tumblr", "Mastodon", "Patreon",
  "WeChat", "VK", "GitHub", "Substack", "Bandcamp", "Sitio web", "Otra plataforma",
];
const tecnicasDisponibles = [
  "Óleo sobre lienzo", "Acrílico sobre lienzo", "Acuarela", "Gouache", "Témpera", "Fresco", "Encáustica",
  "Lápiz de grafito", "Carboncillo", "Sanguina", "Pastel seco", "Pastel al óleo", "Tinta", "Plumilla",
  "Lápices de color", "Marcadores", "Dibujo a mano alzada", "Xilografía", "Linograbado", "Grabado en metal",
  "Aguafuerte", "Aguatinta", "Punta seca", "Litografía", "Serigrafía", "Monotipia", "Collagrafía",
  "Modelado en arcilla", "Cerámica", "Tallado en madera", "Tallado en piedra", "Fundición en bronce",
  "Modelado en yeso", "Ensamblaje", "Soldadura artística", "Cartonería", "Papel maché", "Mosaico",
  "Vitral", "Arte textil", "Bordado", "Tejido", "Collage", "Técnica mixta", "Instalación", "Otra técnica",
];
const aniosDisponibles = Array.from({ length: new Date().getFullYear() - 1899 }, (_, indice) => String(new Date().getFullYear() - indice));

type Obra = {
  id: string;
  titulo: string;
  tecnica: string;
  dimensiones: string;
  anio: string;
  descripcion: string;
  imagenUrl: string;
  audioUrl: string;
  precio: string;
  disponible: boolean;
  colecciones: string[];
  categoriaLegacy?: string;
  categoriasLegacy?: string[];
};

function obtenerColecciones(datos: { colecciones?: unknown; categoria?: unknown; categorias?: unknown }): string[] {
  const guardadas = Array.isArray(datos.colecciones)
    ? datos.colecciones.filter((valor): valor is string => typeof valor === "string")
    : typeof datos.colecciones === "string" ? [datos.colecciones] : [];
  const categoriasAnteriores = [datos.categoria, ...(Array.isArray(datos.categorias) ? datos.categorias : [])]
    .filter((valor): valor is string => typeof valor === "string");
  return [...new Set([...guardadas, ...categoriasAnteriores].map((nombre) => nombre.trim()).filter(Boolean))];
}

function mismaColeccion(a: string, b: string) {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base" }) === 0;
}

function SelectorColecciones({ opciones, seleccionadas, nueva, alCambiarNueva, alAlternar, alAgregar }: {
  opciones: string[];
  seleccionadas: string[];
  nueva: string;
  alCambiarNueva: (valor: string) => void;
  alAlternar: (nombre: string) => void;
  alAgregar: () => void;
}) {
  return <div><div className="flex flex-wrap gap-2">{opciones.map((nombre) => <button key={nombre} type="button" onClick={() => alAlternar(nombre)} aria-pressed={seleccionadas.includes(nombre)} className={`rounded-full border px-3 py-2 text-xs ${seleccionadas.includes(nombre) ? "border-red-500 bg-red-500/15 text-white" : "border-zinc-700 text-gray-400"}`}>{nombre}</button>)}</div><div className="mt-3 flex gap-2"><input value={nueva} onChange={(e) => alCambiarNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); alAgregar(); } }} className="min-w-0 flex-1 border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" placeholder="Nombre de nueva colección" /><button type="button" onClick={alAgregar} className="border border-zinc-700 px-3 text-sm text-white">Agregar</button></div></div>;
}

export default function AdminPage() {
  const [seccionActiva, setSeccionActiva] = useState<"perfil" | "agregar" | "obras" | "colecciones" | "editar">("obras");
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const [titulo, setTitulo] = useState("");
  const [tecnica, setTecnica] = useState("");
  const [ancho, setAncho] = useState(50);
  const [alto, setAlto] = useState(70);
  const [unidad, setUnidad] = useState("cm");
  const [anio, setAnio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [colecciones, setColecciones] = useState<string[]>([]);
  const [nuevaColeccion, setNuevaColeccion] = useState("");
  const [precio, setPrecio] = useState("");
  const [disponible, setDisponible] = useState(true);

  const [imagen, setImagen] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [vistaPreviaObra, setVistaPreviaObra] = useState("");
  const vistaPreviaObraUrl = useRef("");
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [analisisIAActivo, setAnalisisIAActivo] = useState(false);
  const [analizandoImagen, setAnalizandoImagen] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [catalogoColecciones, setCatalogoColecciones] = useState<string[]>([]);
  const [eliminandoColeccion, setEliminandoColeccion] = useState("");
  const [cargandoObras, setCargandoObras] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [obraEditando, setObraEditando] = useState<Obra | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTecnica, setEditTecnica] = useState("");
  const [editDimensiones, setEditDimensiones] = useState("");
  const [editAnio, setEditAnio] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editColecciones, setEditColecciones] = useState<string[]>([]);
  const [nuevaColeccionEdicion, setNuevaColeccionEdicion] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editDisponible, setEditDisponible] = useState(true);
  const [editImagen, setEditImagen] = useState<File | null>(null);
  const [editAudio, setEditAudio] = useState<File | null>(null);
  const [artistaNombre, setArtistaNombre] = useState("Yasiel Pérez Díaz");
  const [artistaBio, setArtistaBio] = useState("");
  const [artistaWhatsApp, setArtistaWhatsApp] = useState("");
  const [fotoArtistaUrl, setFotoArtistaUrl] = useState("");
  const [fotoArtista, setFotoArtista] = useState<File | null>(null);
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState("");
  const vistaPreviaFotoUrl = useRef("");
  const [redes, setRedes] = useState<RedSocial[]>([{ nombre: "Instagram", url: "" }]);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  async function agregarNuevaColeccion() {
    const nombre = nuevaColeccion.trim();
    setNuevaColeccion("");
    if (!nombre) return;
    const catalogoActualizado = [...new Set([...catalogoColecciones, nombre])];
    setCatalogoColecciones(catalogoActualizado);
    guardarColeccionesLocales(catalogoActualizado);
    setColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
    try {
      await setDoc(artistDoc, { colecciones: arrayUnion(nombre) }, { merge: true });
      setCatalogoColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
      setColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
      setMensaje(`Colección “${nombre}” guardada para futuras obras.`);
    } catch (error) {
      console.error(error);
      setMensaje("La colección quedó guardada en este navegador, pero Firebase rechazó la sincronización.");
    }
  }

  async function agregarColeccionEdicion() {
    const nombre = nuevaColeccionEdicion.trim();
    setNuevaColeccionEdicion("");
    if (!nombre) return;
    const catalogoActualizado = [...new Set([...catalogoColecciones, nombre])];
    setCatalogoColecciones(catalogoActualizado);
    guardarColeccionesLocales(catalogoActualizado);
    setEditColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
    try {
      await setDoc(artistDoc, { colecciones: arrayUnion(nombre) }, { merge: true });
      setCatalogoColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
      setEditColecciones((actuales) => actuales.includes(nombre) ? actuales : [...actuales, nombre]);
      setMensaje(`Colección “${nombre}” guardada para futuras obras.`);
    } catch (error) {
      console.error(error);
      setMensaje("La colección quedó guardada en este navegador, pero Firebase rechazó la sincronización.");
    }
  }

  function cambiarImagen(archivo: File | null) {
    if (vistaPreviaObraUrl.current) URL.revokeObjectURL(vistaPreviaObraUrl.current);
    vistaPreviaObraUrl.current = archivo ? URL.createObjectURL(archivo) : "";
    setImagen(archivo);
    setVistaPreviaObra(vistaPreviaObraUrl.current);
  }

  function cambiarFotoArtista(archivo: File | null) {
    if (vistaPreviaFotoUrl.current) URL.revokeObjectURL(vistaPreviaFotoUrl.current);
    vistaPreviaFotoUrl.current = archivo ? URL.createObjectURL(archivo) : "";
    setFotoArtista(archivo);
    setVistaPreviaFoto(vistaPreviaFotoUrl.current);
  }

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargandoUsuario(false);
    });

    return () => cancelar();
  }, []);

  useEffect(() => () => {
    if (vistaPreviaFotoUrl.current) URL.revokeObjectURL(vistaPreviaFotoUrl.current);
    if (vistaPreviaObraUrl.current) URL.revokeObjectURL(vistaPreviaObraUrl.current);
  }, []);

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const perfil = await getDoc(artistDoc);
        if (perfil.exists()) {
          const datos = perfil.data();
          const catalogo = [...new Set([...leerColeccionesLocales(), ...(Array.isArray(datos.colecciones) ? datos.colecciones : [])])];
          setCatalogoColecciones(catalogo);
          guardarColeccionesLocales(catalogo);
          setArtistaNombre(datos.nombre || "Yasiel Pérez Díaz");
          setArtistaBio(datos.biografia || "");
          setArtistaWhatsApp(datos.whatsapp || "");
          setFotoArtistaUrl(datos.fotoUrl || "");
          const redesGuardadas = datos.redes;
          setRedes(Array.isArray(redesGuardadas)
            ? (redesGuardadas.length ? redesGuardadas : [{ nombre: "Instagram", url: "" }])
            : Object.entries(redesGuardadas || {}).map(([nombre, url]) => ({ nombre, url: String(url) })));
        }
      } catch (error) {
        console.error("Error cargando el perfil:", error);
        setCatalogoColecciones(leerColeccionesLocales());
      }
    }
    cargarPerfil();
  }, []);

  async function guardarPerfilArtista() {
    setGuardandoPerfil(true);
    try {
      const fotoUrl = fotoArtista ? await subirArchivo(fotoArtista, "image") : fotoArtistaUrl;
      await setDoc(artistDoc, { nombre: artistaNombre, biografia: artistaBio, whatsapp: artistaWhatsApp, fotoUrl, redes: redes.filter((red) => red.nombre.trim() && red.url.trim()) }, { merge: true });
      setFotoArtistaUrl(fotoUrl);
      cambiarFotoArtista(null);
      setMensaje("Ficha del artista actualizada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo guardar la ficha del artista.");
    } finally { setGuardandoPerfil(false); }
  }

  async function eliminarColeccion(nombre: string) {
    const confirmar = window.confirm(`¿Seguro que quieres eliminar la colección “${nombre}”? También se quitará de todas las obras que la tengan asignada.`);
    if (!confirmar) return;

    setEliminandoColeccion(nombre);
    setMensaje("Eliminando colección de las obras...");
    try {
      const afectadas = obras.filter((obra) => obra.colecciones.some((coleccion) => mismaColeccion(coleccion, nombre)) || (obra.categoriaLegacy && mismaColeccion(obra.categoriaLegacy, nombre)) || obra.categoriasLegacy?.some((categoria) => mismaColeccion(categoria, nombre)));

      for (let inicio = 0; inicio < afectadas.length; inicio += 450) {
        const lote = writeBatch(db);
        for (const obra of afectadas.slice(inicio, inicio + 450)) {
          const coleccionesRestantes = obra.colecciones.filter((coleccion) => !mismaColeccion(coleccion, nombre));
          const cambios: { colecciones: string[]; categoria?: string; categorias: string[] } = {
            colecciones: coleccionesRestantes,
            categorias: (obra.categoriasLegacy ?? []).filter((categoria) => !mismaColeccion(categoria, nombre)),
          };
          if (obra.categoriaLegacy && mismaColeccion(obra.categoriaLegacy, nombre)) cambios.categoria = "";
          lote.update(doc(db, "obras", obra.id), cambios);
        }
        await lote.commit();
      }

      const actualizadas = obras.map((obra) => ({
        ...obra,
        colecciones: obra.colecciones.filter((coleccion) => !mismaColeccion(coleccion, nombre)),
        categoriaLegacy: obra.categoriaLegacy && mismaColeccion(obra.categoriaLegacy, nombre) ? "" : obra.categoriaLegacy,
        categoriasLegacy: (obra.categoriasLegacy ?? []).filter((categoria) => !mismaColeccion(categoria, nombre)),
      }));
      const catalogo = catalogoColecciones.filter((coleccion) => !mismaColeccion(coleccion, nombre));
      setObras(actualizadas);
      setCatalogoColecciones(catalogo);
      guardarColeccionesLocales(catalogo);
      setColecciones((actuales) => actuales.filter((coleccion) => !mismaColeccion(coleccion, nombre)));
      setEditColecciones((actuales) => actuales.filter((coleccion) => !mismaColeccion(coleccion, nombre)));
      try {
        await setDoc(artistDoc, { colecciones: arrayRemove(nombre) }, { merge: true });
        setMensaje(`Colección “${nombre}” eliminada.`);
      } catch (error) {
        console.error(error);
        setMensaje(`Colección eliminada de las obras y de este navegador; Firebase rechazó sincronizar el catálogo.`);
      }
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la colección. Firebase rechazó el cambio; revisa los permisos.");
    } finally {
      setEliminandoColeccion("");
    }
  }

  async function editarColeccion(nombre: string) {
    const respuesta = window.prompt(`Escribe el nuevo nombre para “${nombre}”:`, nombre);
    if (respuesta === null) return;
    const nuevoNombre = respuesta.trim();
    if (!nuevoNombre) {
      setMensaje("El nombre de la colección no puede quedar vacío.");
      return;
    }
    if (mismaColeccion(nombre, nuevoNombre)) return;

    const nombresActuales = [...catalogoColecciones, ...obras.flatMap((obra) => obra.colecciones)];
    if (nombresActuales.some((actual) => mismaColeccion(actual, nuevoNombre) && !mismaColeccion(actual, nombre))) {
      setMensaje(`Ya existe una colección llamada “${nuevoNombre}”.`);
      return;
    }

    setEliminandoColeccion(nombre);
    setMensaje("Actualizando nombre de la colección...");
    try {
      const reemplazar = (nombres: string[]) => [...new Set(nombres.map((actual) => mismaColeccion(actual, nombre) ? nuevoNombre : actual))];
      const afectadas = obras.filter((obra) => obra.colecciones.some((actual) => mismaColeccion(actual, nombre)) || (obra.categoriaLegacy && mismaColeccion(obra.categoriaLegacy, nombre)) || obra.categoriasLegacy?.some((actual) => mismaColeccion(actual, nombre)));

      for (let inicio = 0; inicio < afectadas.length; inicio += 450) {
        const lote = writeBatch(db);
        for (const obra of afectadas.slice(inicio, inicio + 450)) {
          const cambios: { colecciones: string[]; categoria?: string; categorias: string[] } = {
            colecciones: reemplazar(obra.colecciones),
            categorias: reemplazar(obra.categoriasLegacy ?? []),
          };
          if (obra.categoriaLegacy) cambios.categoria = mismaColeccion(obra.categoriaLegacy, nombre) ? nuevoNombre : obra.categoriaLegacy;
          lote.update(doc(db, "obras", obra.id), cambios);
        }
        await lote.commit();
      }

      const obrasActualizadas = obras.map((obra) => ({
        ...obra,
        colecciones: reemplazar(obra.colecciones),
        categoriaLegacy: obra.categoriaLegacy && mismaColeccion(obra.categoriaLegacy, nombre) ? nuevoNombre : obra.categoriaLegacy,
        categoriasLegacy: reemplazar(obra.categoriasLegacy ?? []),
      }));
      const catalogoActualizado = reemplazar([...new Set(nombresActuales)]);
      setObras(obrasActualizadas);
      setCatalogoColecciones(catalogoActualizado);
      guardarColeccionesLocales(catalogoActualizado);
      setColecciones((actuales) => reemplazar(actuales));
      setEditColecciones((actuales) => reemplazar(actuales));

      try {
        await setDoc(artistDoc, { colecciones: catalogoActualizado }, { merge: true });
        setMensaje(`Colección renombrada a “${nuevoNombre}” en el catálogo y las obras.`);
      } catch (error) {
        console.error(error);
        setMensaje("La colección se renombró en las obras y en este navegador, pero Firebase rechazó actualizar el catálogo.");
      }
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar el nombre. Firebase rechazó la actualización; revisa los permisos.");
    } finally {
      setEliminandoColeccion("");
    }
  }

  useEffect(() => {
    async function cargarObras() {
      try {
        const consulta = await getDocs(collection(db, "obras"));

        const obrasFirebase: Obra[] = consulta.docs.map((documento) => {
          const datos = documento.data();

          return {
            id: documento.id,
            titulo: datos.titulo || "",
            tecnica: datos.tecnica || "",
            dimensiones: datos.dimensiones || "",
            anio: datos.anio || "",
            descripcion: datos.descripcion || "",
            imagenUrl: datos.imagenUrl || "",
            audioUrl: datos.audioUrl || "",
            precio: datos.precio || "",
            disponible: datos.disponible ?? true,
            colecciones: obtenerColecciones(datos),
            categoriaLegacy: typeof datos.categoria === "string" ? datos.categoria : "",
            categoriasLegacy: Array.isArray(datos.categorias) ? datos.categorias.filter((valor): valor is string => typeof valor === "string") : [],
          };
        });

        setObras(obrasFirebase);
      } catch (error) {
        console.error("Error cargando obras:", error);
      } finally {
        setCargandoObras(false);
      }
    }

    cargarObras();
  }, []);

  async function iniciarSesion() {
    setErrorLogin("");

    if (!email || !password) {
      setErrorLogin("Escribe tu correo y contraseña.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      setErrorLogin("Correo o contraseña incorrectos.");
    }
  }

  async function cerrarSesion() {
    await signOut(auth);
  }

  async function eliminarObra(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta obra?"
    );

    if (!confirmar) {
      return;
    }

    try {
      await deleteDoc(doc(db, "obras", id));

      setObras((obrasActuales) =>
        obrasActuales.filter((obra) => obra.id !== id)
      );

      setMensaje("Obra eliminada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la obra.");
    }
  }

  function comenzarEdicion(obra: Obra) {
    setSeccionActiva("editar");
    setObraEditando(obra);

    setEditTitulo(obra.titulo);
    setEditTecnica(obra.tecnica);
    setEditDimensiones(obra.dimensiones);
    setEditAnio(obra.anio);
    setEditDescripcion(obra.descripcion);
    setEditColecciones(obra.colecciones || []);
    setNuevaColeccionEdicion("");
    setEditPrecio(obra.precio || "");
    setEditDisponible(obra.disponible ?? true);
    setEditImagen(null);
    setEditAudio(null);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  function cancelarEdicion() {
    setObraEditando(null);
    setSeccionActiva("obras");
  }

  async function guardarEdicion() {
    if (!obraEditando) {
      return;
    }

    try {
      setSubiendo(true);
      const cambios: Record<string, string | boolean | string[]> = {
        titulo: editTitulo,
        tecnica: editTecnica,
        dimensiones: editDimensiones,
        anio: editAnio,
        descripcion: editDescripcion,
        colecciones: editColecciones,
        categoria: "",
        categorias: [],
        precio: editPrecio,
        disponible: editDisponible,
      };
      if (editImagen) cambios.imagenUrl = await subirArchivo(editImagen, "image");
      if (editAudio) cambios.audioUrl = await subirArchivo(editAudio, "raw");
      await updateDoc(doc(db, "obras", obraEditando.id), cambios);

      setObras((obrasActuales) =>
        obrasActuales.map((obra) =>
          obra.id === obraEditando.id
            ? {
                ...obra,
                titulo: editTitulo,
                tecnica: editTecnica,
                dimensiones: editDimensiones,
                anio: editAnio,
                descripcion: editDescripcion,
                colecciones: editColecciones,
                categoriaLegacy: "",
                categoriasLegacy: [],
                precio: editPrecio,
                disponible: editDisponible,
                imagenUrl: typeof cambios.imagenUrl === "string" ? cambios.imagenUrl : obra.imagenUrl,
                audioUrl: typeof cambios.audioUrl === "string" ? cambios.audioUrl : obra.audioUrl,
              }
            : obra
        )
      );

      setObraEditando(null);
      setMensaje("Obra actualizada correctamente.");
    } catch (error) {
      console.error(error);
      const codigo = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      setMensaje(codigo.includes("permission-denied")
        ? "Firebase rechazó guardar la obra. Inicia sesión con la cuenta administradora configurada en firestore.rules."
        : "No se pudo actualizar la obra. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function subirArchivo(
    archivo: File,
    tipo: "image" | "raw"
  ) {
    const formatos = tipo === "image"
      ? ["jpg", "jpeg", "png", "webp"]
      : ["mp3", "m4a", "wav", "ogg", "webm", "aac", "mp4"];
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "";
    const limiteBytes = tipo === "image" ? 10 * 1024 * 1024 : 25 * 1024 * 1024;

    if (!formatos.includes(extension)) {
      throw new Error(tipo === "image"
        ? "Usa una imagen JPG, PNG o WEBP."
        : "Usa un audio MP3, M4A, WAV, OGG, WEBM o AAC.");
    }
    if (archivo.size > limiteBytes) {
      throw new Error(tipo === "image"
        ? "La imagen no debe superar 10 MB."
        : "El audio no debe superar 25 MB.");
    }

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error("La sesión expiró. Vuelve a iniciar sesión.");

    const firmaRespuesta = await fetch("/api/firmar-carga-cloudinary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ resourceType: tipo }),
    });
    const firma = await firmaRespuesta.json().catch(() => ({}));
    if (!firmaRespuesta.ok) {
      throw new Error(firma.error || "No se pudo autorizar la subida del archivo.");
    }

    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("api_key", firma.apiKey);
    formData.append("timestamp", String(firma.timestamp));
    formData.append("signature", firma.signature);
    formData.append("folder", firma.folder);
    formData.append("allowed_formats", firma.allowedFormats);

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${firma.cloudName}/${tipo}/upload`,
      { method: "POST", body: formData },
    );
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || typeof datos.secure_url !== "string") {
      console.error("Cloudinary upload failed:", datos.error?.message);
      throw new Error("No se pudo subir el archivo a Cloudinary. Comprueba la configuración y el formato.");
    }
    return datos.secure_url as string;
  }

  async function guardarObra() {
    if (!titulo || !tecnica) {
      setMensaje("Completa al menos el título y la técnica.");
      return;
    }

    if (!imagen) {
      setMensaje("Selecciona una imagen para la obra.");
      return;
    }

    try {
      setSubiendo(true);
      setMensaje("Subiendo imagen...");

      const imagenUrl = await subirArchivo(imagen, "image");

      const audioUrl = audio ? await subirArchivo(audio, "raw") : "";

      setMensaje("Guardando obra...");

      await addDoc(collection(db, "obras"), {
        titulo,
        tecnica,
        dimensiones: `${ancho} × ${alto} ${unidad}`,
        anio,
        descripcion,
        colecciones,
        precio,
        disponible,
        imagenUrl,
        audioUrl,
        nombreImagen: imagen.name,
        nombreAudio: audio?.name || "",
        fechaCreacion: new Date().toISOString(),
      });

      setMensaje("¡Obra guardada correctamente!");

      setTitulo("");
      setTecnica("");
      setAncho(50);
      setAlto(70);
      setUnidad("cm");
      setAnio("");
      setDescripcion("");
      setColecciones([]);
      setNuevaColeccion("");
      setPrecio("");
      setDisponible(true);
      cambiarImagen(null);
      setAudio(null);
      setAnalisisIAActivo(false);

      const consulta = await getDocs(collection(db, "obras"));

      const obrasActualizadas: Obra[] = consulta.docs.map((documento) => {
        const datos = documento.data();

        return {
          id: documento.id,
          titulo: datos.titulo || "",
          tecnica: datos.tecnica || "",
          dimensiones: datos.dimensiones || "",
          anio: datos.anio || "",
          descripcion: datos.descripcion || "",
          imagenUrl: datos.imagenUrl || "",
          audioUrl: datos.audioUrl || "",
          precio: datos.precio || "",
          disponible: datos.disponible ?? true,
          colecciones: obtenerColecciones(datos),
          categoriaLegacy: typeof datos.categoria === "string" ? datos.categoria : "",
          categoriasLegacy: Array.isArray(datos.categorias) ? datos.categorias.filter((valor): valor is string => typeof valor === "string") : [],
        };
      });

      setObras(obrasActualizadas);
    } catch (error) {
      console.error(error);
      setMensaje(
        "Ocurrió un error al subir los archivos. Revisa la consola."
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function analizarImagenConIA() {
    if (!imagen) {
      setMensaje("Primero selecciona una imagen para analizar.");
      return;
    }
    if (imagen.size > 8 * 1024 * 1024) {
      setMensaje("La imagen debe pesar menos de 8 MB para el análisis.");
      return;
    }

    try {
      setAnalizandoImagen(true);
      setMensaje("Analizando la imagen...");
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la imagen."));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(imagen);
      });
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("La sesión expiró. Vuelve a iniciar sesión.");

      const response = await fetch("/api/analizar-obra", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ imageDataUrl }),
      });
      const resultado = await response.json().catch(() => ({ error: "El análisis de IA aún no está configurado para este sitio." }));
      if (!response.ok) throw new Error(resultado.error || "No se pudo analizar la imagen.");

      setDescripcion((actual) => actual ? `${actual.trim()}\n\n${resultado.descripcion}` : resultado.descripcion);
      setMensaje("Análisis agregado a la descripción. Puedes editarlo antes de guardar.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo analizar la imagen.");
    } finally {
      setAnalizandoImagen(false);
    }
  }

  if (cargandoUsuario) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Comprobando acceso...</p>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          <p className="text-red-500 text-sm tracking-[0.3em] mb-4">
            ESTUDIO DE ARTE YASS
          </p>

          <h1 className="text-4xl font-light mb-10">
            Administrador
          </h1>

          <div className="space-y-5">

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Tu correo"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    iniciarSesion();
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Tu contraseña"
              />
            </div>

            {errorLogin && (
              <p className="text-red-400 text-sm">
                {errorLogin}
              </p>
            )}

            <button
              onClick={iniciarSesion}
              className="w-full border border-white px-6 py-3 hover:bg-white hover:text-black transition"
            >
              ENTRAR
            </button>

          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">

      <div className="max-w-3xl mx-auto">

        <div className="flex justify-between items-center mb-12">

          <div>
            <p className="text-red-500 text-sm tracking-[0.3em]">
              ESTUDIO DE ARTE YASS
            </p>

            <h1 className="text-4xl font-light mt-3">
              Administrador
            </h1>
          </div>

          <button
            onClick={cerrarSesion}
            className="border border-zinc-700 px-4 py-2 text-sm hover:border-white"
          >
            Cerrar sesión
          </button>

        </div>

        <nav className="admin-action-menu mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Acciones de administración">
          <button type="button" onClick={() => setSeccionActiva("perfil")} aria-current={seccionActiva === "perfil" ? "page" : undefined} className={seccionActiva === "perfil" ? "admin-action active" : "admin-action"}><span>01</span><strong>Perfil público</strong><small>Editar información y redes</small></button>
          <button type="button" onClick={() => setSeccionActiva("agregar")} aria-current={seccionActiva === "agregar" ? "page" : undefined} className={seccionActiva === "agregar" ? "admin-action active" : "admin-action"}><span>02</span><strong>Agregar obra</strong><small>Publicar una nueva pieza</small></button>
          <button type="button" onClick={() => setSeccionActiva("obras")} aria-current={seccionActiva === "obras" ? "page" : undefined} className={seccionActiva === "obras" ? "admin-action active" : "admin-action"}><span>03</span><strong>Mis obras</strong><small>Administrar la colección</small></button>
          <button type="button" onClick={() => setSeccionActiva("colecciones")} aria-current={seccionActiva === "colecciones" ? "page" : undefined} className={seccionActiva === "colecciones" ? "admin-action active" : "admin-action"}><span>04</span><strong>Colecciones</strong><small>Ver y eliminar colecciones</small></button>
        </nav>
        {seccionActiva === "perfil" && (
          <section className="mb-12 border border-zinc-800 p-6 md:p-10">
          <p className="text-xs tracking-[0.25em] text-red-400">PERFIL PÚBLICO</p>
          <h2 className="mb-7 mt-3 text-2xl font-light">Ficha del artista</h2>
          <div className="space-y-5">
            <div><label className="mb-2 block text-sm text-gray-400">Nombre del artista</label><input value={artistaNombre} onChange={(event) => setArtistaNombre(event.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" /></div>
            <div><label className="mb-2 block text-sm text-gray-400">WhatsApp del artista</label><input type="tel" inputMode="tel" value={artistaWhatsApp} onChange={(event) => setArtistaWhatsApp(event.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" placeholder="+52 55 1234 5678" /><p className="mt-2 text-xs text-gray-500">Incluye el código de país, por ejemplo +52 para México.</p></div>
            <div>
              <label className="mb-3 block text-sm text-gray-400">Fotografía del artista</label>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-xs text-gray-500">
                  {(vistaPreviaFoto || fotoArtistaUrl) ? <Image src={vistaPreviaFoto || fotoArtistaUrl} alt="Vista previa del artista" fill sizes="112px" unoptimized={Boolean(vistaPreviaFoto)} className="object-cover" /> : "Sin foto"}
                </div>
                <div className="space-y-2"><input type="file" accept="image/*" onChange={(event) => cambiarFotoArtista(event.target.files?.[0] || null)} className="w-full text-sm text-gray-400" /><p className="text-xs text-gray-500">La foto se mostrará en la ficha pública del artista.</p>{fotoArtista && <button type="button" onClick={() => cambiarFotoArtista(null)} className="text-xs text-gray-400 underline">Cancelar reemplazo</button>}</div>
              </div>
            </div>
            <div><label className="mb-2 block text-sm text-gray-400">Información sobre el artista</label><textarea value={artistaBio} onChange={(event) => setArtistaBio(event.target.value)} rows={6} maxLength={3000} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" placeholder="Trayectoria, inspiración, técnicas, exposiciones..." /></div>
            <h3 className="pt-2 text-sm text-gray-300">Redes sociales, portafolios y sitios web</h3>
            <div className="space-y-3">
              {redes.map((red, indice) => <div key={indice} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                <div>
                  <select value={redesDisponibles.includes(red.nombre) ? red.nombre : "Otra plataforma"} onChange={(event) => setRedes((actuales) => actuales.map((item, i) => i === indice ? { ...item, nombre: event.target.value === "Otra plataforma" ? "" : event.target.value } : item))} aria-label="Seleccionar red social" className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white">{redesDisponibles.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select>
                  {(!red.nombre || !redesDisponibles.includes(red.nombre)) && <input value={red.nombre} onChange={(event) => setRedes((actuales) => actuales.map((item, i) => i === indice ? { ...item, nombre: event.target.value } : item))} aria-label="Nombre de otra plataforma" className="mt-2 w-full border border-zinc-700 bg-zinc-900 px-4 py-3" placeholder="Nombre de la plataforma" />}
                </div>
                <input type="url" value={red.url} onChange={(event) => setRedes((actuales) => actuales.map((item, i) => i === indice ? { ...item, url: event.target.value } : item))} aria-label="Enlace de la red social" className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" placeholder="https://..." />
                <button type="button" onClick={() => setRedes((actuales) => actuales.filter((_, i) => i !== indice))} aria-label="Quitar enlace" className="min-h-12 border border-zinc-700 px-4 text-gray-400 hover:border-red-500 hover:text-red-400">×</button>
              </div>)}
            </div>
            <button type="button" onClick={() => setRedes((actuales) => [...actuales, { nombre: "", url: "" }])} className="border border-zinc-700 px-4 py-3 text-sm text-gray-300 hover:border-white">+ Añadir otra red o enlace</button>
            <button onClick={guardarPerfilArtista} disabled={guardandoPerfil} className="min-h-12 bg-white px-6 py-3 text-sm text-black transition hover:bg-gray-200 disabled:opacity-50">{guardandoPerfil ? "GUARDANDO..." : "GUARDAR FICHA DEL ARTISTA"}</button>
          </div>
        </section>
        )}

        {seccionActiva === "colecciones" && (
          <section className="mb-12 border border-zinc-800 p-6 md:p-10">
            <p className="text-xs tracking-[0.25em] text-red-400">CATÁLOGO</p>
            <h2 className="mb-3 mt-3 text-2xl font-light">Administrar colecciones</h2>
            <p className="mb-7 text-sm text-gray-400">Puedes cambiar el nombre o eliminar una colección. Ambos cambios se aplican a todas las obras que la tengan asignada.</p>
            {Array.from(new Set([...catalogoColecciones, ...obras.flatMap((obra) => obra.colecciones)])).sort((a, b) => a.localeCompare(b)).length === 0
              ? <p className="text-sm text-gray-400">Aún no hay colecciones guardadas.</p>
              : <div className="space-y-2">{Array.from(new Set([...catalogoColecciones, ...obras.flatMap((obra) => obra.colecciones)])).sort((a, b) => a.localeCompare(b)).map((nombre) => <div key={nombre} className="flex flex-wrap items-center justify-between gap-4 border border-zinc-800 px-4 py-3"><div><p className="text-sm text-white">{nombre}</p><p className="mt-1 text-xs text-gray-500">{obras.filter((obra) => obra.colecciones.some((coleccion) => mismaColeccion(coleccion, nombre))).length} obras</p></div><div className="flex gap-2"><button type="button" disabled={eliminandoColeccion === nombre} onClick={() => editarColeccion(nombre)} className="border border-zinc-700 px-3 py-2 text-xs text-gray-200 hover:border-white disabled:opacity-50">Editar</button><button type="button" disabled={eliminandoColeccion === nombre} onClick={() => eliminarColeccion(nombre)} className="border border-red-900 px-3 py-2 text-xs text-red-300 hover:border-red-500 disabled:opacity-50">{eliminandoColeccion === nombre ? "Procesando..." : "Eliminar"}</button></div></div>)}</div>}
          </section>
        )}

        {seccionActiva === "agregar" && (
          <div className="border border-zinc-800 p-6 md:p-10">

          <h2 className="text-2xl font-light mb-8">
            Agregar nueva obra
          </h2>

          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-upload-card admin-image-upload">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const archivo = e.target.files?.[0] || null; cambiarImagen(archivo); setEditorAbierto(Boolean(archivo)); }} className="sr-only" />
                {vistaPreviaObra ? <Image src={vistaPreviaObra} alt="Vista previa de la obra" width={56} height={56} unoptimized className="admin-upload-preview" /> : <span className="admin-upload-icon" aria-hidden="true">＋</span>}
                <span className="admin-upload-copy"><strong>{imagen ? "Cambiar imagen" : "Agregar imagen"}</strong><small>{imagen ? imagen.name : "JPG, PNG o WEBP · Requerida"}</small></span>
              </label>
              <label className="admin-upload-card admin-audio-upload">
                <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] || null)} className="sr-only" />
                <span className="admin-upload-icon" aria-hidden="true">♫</span>
                <span className="admin-upload-copy"><strong>{audio ? "Cambiar audio" : "Agregar audio"}</strong><small>{audio ? audio.name : "MP3 u otro formato · Opcional"}</small></span>
              </label>
            </div>
            {imagen && vistaPreviaObra && (editorAbierto
              ? <ImageEditor src={vistaPreviaObra} fileName={imagen.name} onApply={(archivo) => { cambiarImagen(archivo); setEditorAbierto(false); }} onCancel={() => setEditorAbierto(false)} />
              : <button type="button" onClick={() => setEditorAbierto(true)} className="border border-zinc-700 px-4 py-2 text-sm text-white hover:border-red-500">Editar imagen</button>)}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Título
              </label>

              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Nombre de la obra"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Técnica
              </label>

              <select value={tecnica} onChange={(e) => setTecnica(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white">
                <option value="">Selecciona una técnica</option>
                {tecnicasDisponibles.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-2 block text-sm text-gray-400">Colecciones</label><SelectorColecciones opciones={Array.from(new Set([...catalogoColecciones, ...obras.flatMap((obra) => obra.colecciones), ...colecciones]))} seleccionadas={colecciones} nueva={nuevaColeccion} alCambiarNueva={setNuevaColeccion} alAlternar={(nombre) => setColecciones((actuales) => actuales.includes(nombre) ? actuales.filter((item) => item !== nombre) : [...actuales, nombre])} alAgregar={agregarNuevaColeccion} /></div>
              <div><label className="mb-2 block text-sm text-gray-400">Precio (MXN)</label><input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" placeholder="Ej. 4500" /></div>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} className="h-4 w-4 accent-red-500" /> Disponible para venta</label>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Dimensiones
              </label>

              <div className="grid gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-2">
                {[["Ancho", ancho, setAncho], ["Alto", alto, setAlto]].map(([etiqueta, valor, actualizar]) => <label key={String(etiqueta)} className="dimension-slider"><span><span>{String(etiqueta)}</span><strong>{String(valor)} {unidad}</strong></span><input type="range" min="5" max="170" step="5" value={Number(valor)} onChange={(e) => (actualizar as (n: number) => void)(Number(e.target.value))} /><small>5–170, en intervalos de 5</small></label>)}
                <label className="sm:col-span-2"><span className="mb-2 block text-sm text-gray-400">Unidad de medida</span><select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"><option value="cm">Centímetros (cm)</option><option value="mm">Milímetros (mm)</option><option value="in">Pulgadas (in)</option></select></label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Año
              </label>

              <select value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"><option value="">Selecciona el año</option>{aniosDisponibles.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}</select>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="descripcion-obra" className="block text-sm text-gray-400">Descripción</label>
                {process.env.NEXT_PUBLIC_ENABLE_AI_ANALYSIS === "true" && <label className="ai-toggle"><input type="checkbox" checked={analisisIAActivo} onChange={(e) => setAnalisisIAActivo(e.target.checked)} /><span>✦</span> Sugerir análisis con IA</label>}
              </div>
              {analisisIAActivo && <div className="ai-analysis-card mb-3"><p>OpenAI propondrá una lectura formal y conceptual a partir de la imagen. Podrás editar el texto antes de guardar. Cada análisis puede generar cargos de API.</p><button type="button" onClick={analizarImagenConIA} disabled={analizandoImagen || !imagen} className="ai-analysis-button">{analizandoImagen ? "Analizando imagen…" : "✦ Analizar imagen y redactar"}</button></div>}
              <textarea
                id="descripcion-obra"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Describe la obra o usa el análisis como punto de partida..."
              />
            </div>



            <button
              onClick={guardarObra}
              disabled={subiendo}
              className="w-full bg-white text-black px-6 py-4 hover:bg-gray-200 transition disabled:opacity-50"
            >
              {subiendo ? "SUBIENDO..." : "GUARDAR OBRA"}
            </button>

            {mensaje && (
              <p className="text-gray-400 text-sm">
                {mensaje}
              </p>
            )}

          </div>
        </div>

        )}

        {seccionActiva === "obras" && (
          <div className="mt-12">

          <p className="text-red-500 text-sm tracking-[0.3em]">
            COLECCIÓN
          </p>

          <h2 className="text-3xl font-light mt-3 mb-8">
            Mis obras
          </h2>

          {cargandoObras ? (
            <p className="text-gray-500">
              Cargando obras...
            </p>
          ) : obras.length === 0 ? (
            <p className="text-gray-500">
              Todavía no hay obras.
            </p>
          ) : (

            <div className="space-y-4">

              {obras.map((obra) => (

                <div
                  key={obra.id}
                  className="border border-zinc-800 p-4 flex flex-col md:flex-row gap-5"
                >

                  <Image
                    src={obra.imagenUrl}
                    alt={obra.titulo}
                    width={128}
                    height={160}
                    unoptimized
                    className="w-full md:w-32 h-40 object-cover"
                  />

                  <div className="flex-1">

                    <h3 className="text-xl">
                      {obra.titulo}
                    </h3>

                    <p className="text-gray-500 text-sm mt-2">
                      {obra.tecnica}
                    </p>

              <p className="text-gray-600 text-sm">
                {obra.dimensiones} · {obra.anio}
              </p>
                    <p className="mt-1 text-sm text-gray-400">{obra.colecciones.join(", ") || "Sin colección"} · {obra.disponible ? "Disponible" : "Vendida"}{obra.precio ? ` · $${obra.precio} MXN` : ""}</p>

                    <div className="flex gap-3 mt-5">

                      <button
                        onClick={() => comenzarEdicion(obra)}
                        className="border border-zinc-600 text-gray-300 px-4 py-2 text-sm hover:border-white hover:text-white transition"
                      >
                        EDITAR
                      </button>

                      <button
                        onClick={() => eliminarObra(obra.id)}
                        className="border border-red-900 text-red-400 px-4 py-2 text-sm hover:bg-red-900 hover:text-white transition"
                      >
                        ELIMINAR
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
        )}

        {obraEditando && seccionActiva === "editar" && (
          <div className="mt-12 border border-zinc-700 p-6 md:p-10">

            <button type="button" onClick={cancelarEdicion} className="mb-6 text-sm text-gray-400 hover:text-white">← Volver a mis obras</button>

            <div className="flex justify-between items-center mb-8">

              <div>
                <p className="text-red-500 text-sm tracking-[0.3em]">
                  EDITAR OBRA
                </p>

                <h2 className="text-3xl font-light mt-3">
                  {obraEditando.titulo}
                </h2>
              </div>

              <button
                onClick={cancelarEdicion}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>

            </div>

            <div className="space-y-6">

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Título
                </label>

                <input
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Técnica
                </label>

              <select value={editTecnica} onChange={(e) => setEditTecnica(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white">
                {!tecnicasDisponibles.includes(editTecnica) && editTecnica && <option value={editTecnica}>{editTecnica}</option>}
                {tecnicasDisponibles.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-2 block text-sm text-gray-400">Colecciones</label><SelectorColecciones opciones={Array.from(new Set([...catalogoColecciones, ...obras.flatMap((obra) => obra.colecciones), ...editColecciones]))} seleccionadas={editColecciones} nueva={nuevaColeccionEdicion} alCambiarNueva={setNuevaColeccionEdicion} alAlternar={(nombre) => setEditColecciones((actuales) => actuales.includes(nombre) ? actuales.filter((item) => item !== nombre) : [...actuales, nombre])} alAgregar={agregarColeccionEdicion} /></div>
              <div><label className="mb-2 block text-sm text-gray-400">Precio (MXN)</label><input type="number" min="0" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} className="w-full border border-zinc-700 bg-zinc-900 px-4 py-3" /></div>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={editDisponible} onChange={(e) => setEditDisponible(e.target.checked)} className="h-4 w-4 accent-red-500" /> Disponible para venta</label>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Dimensiones
                </label>

                <input
                  value={editDimensiones}
                  onChange={(e) => setEditDimensiones(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Año
                </label>

                <input
                  value={editAnio}
                  onChange={(e) => setEditAnio(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Descripción
                </label>

              <textarea
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm text-gray-400">Reemplazar imagen (opcional)</label><input type="file" accept="image/*" onChange={(e) => setEditImagen(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400" />{editImagen && <p className="mt-2 text-xs text-gray-500">Nueva imagen: {editImagen.name}</p>}</div>
              <div><label className="mb-2 block text-sm text-gray-400">Reemplazar audio (opcional)</label><input type="file" accept="audio/*" onChange={(e) => setEditAudio(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400" />{editAudio && <p className="mt-2 text-xs text-gray-500">Nuevo audio: {editAudio.name}</p>}</div>
            </div>

              <div className="flex gap-3">

              <button
                onClick={guardarEdicion}
                disabled={subiendo}
                className="bg-white text-black px-6 py-3 hover:bg-gray-200 transition"
              >
                {subiendo ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>

                <button
                  onClick={cancelarEdicion}
                  className="border border-zinc-700 px-6 py-3 hover:border-white transition"
                >
                  CANCELAR
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}
