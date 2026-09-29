"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);
const categorias = ["Todas", "Pintura", "Grabado", "Ilustración", "Escultura"];

type Obra = {
  id: string; titulo: string; tecnica: string; dimensiones: string; anio: string;
  descripcion: string; imagenUrl: string; audioUrl: string; categoria: string;
  precio: string; disponible: boolean;
};
type PerfilArtista = { nombre: string; biografia: string; whatsapp: string; redes: { nombre: string; url: string }[] };

function IconoCompartir({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.6 6.6-4.2M8.7 13.4l6.6 4.2" /></svg>;
}

function IconoFiltro({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="2" fill="#11100f" /><circle cx="15" cy="12" r="2" fill="#11100f" /><circle cx="12" cy="17" r="2" fill="#11100f" /></svg>;
}

function IconoRed({ nombre, className = "h-5 w-5" }: { nombre: string; className?: string }) {
  const red = nombre.toLowerCase();
  if (red.includes("instagram")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></svg>;
  if (red.includes("facebook")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" /></svg>;
  if (red.includes("youtube")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M23 7.1a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.5v-7l6.1 3.5-6.1 3.5Z" /></svg>;
  if (red === "x" || red.includes("twitter")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.6 22H2.4l7.3-8.4L1.9 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20Z" /></svg>;
  if (red.includes("tiktok")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M19.6 7.1a6.8 6.8 0 0 1-4.2-1.5v8.1a6.1 6.1 0 1 1-5.3-6.1v3.3a2.9 2.9 0 1 0 2.1 2.8V2h3.2a6.8 6.8 0 0 0 4.2 4.1v3.2Z" /></svg>;
  if (red.includes("linkedin")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.1 0H13v1.6h.1a4 4 0 0 1 3.6-2c3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.4V9Z" /></svg>;
  if (red.includes("pinterest")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.7l1.3-5.5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.3 1.1.6 2 1.7 2 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.7-4.8-4.7-3.3 0-5.2 2.5-5.2 5 0 1 .4 2.1.9 2.7.1.2.2.3.1.6l-.3 1.1c0 .2-.2.3-.4.2-1.5-.7-2.4-2.7-2.4-4.4 0-3.6 2.6-6.9 7.6-6.9 4 0 7.1 2.9 7.1 6.8 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.7-2.8-1.5l-.8 3.1c-.3 1.1-1 2.3-1.5 3.1A10 10 0 1 0 12 2Z" /></svg>;
  if (red.includes("behance")) return <span aria-hidden="true" className={`${className} inline-flex items-center justify-center font-bold leading-none`}>Bē</span>;
  if (red.includes("whatsapp")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.8L2.3 22l5.4-1.4A10 10 0 1 0 12 2Zm0 17.8c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.8.8-3.1-.2-.4A7.9 7.9 0 1 1 12 19.8Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.2.2-.4.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4H9c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.4 1 2.5c.1.2 1.8 2.8 4.2 3.8.6.3 1.1.4 1.6.5.6.2 1.2.1 1.7.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.3-.2-.5-.3Z" /></svg>;
  if (red.includes("telegram")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="m21.8 4.4-3.3 15.4c-.2 1.1-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.9 13.3 1 11.8c-1.1-.3-1.1-1.1.2-1.6l19.1-7.4c.9-.3 1.7.2 1.5 1.6Z" /></svg>;
  if (red.includes("reddit")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M14.5 3.2a1.8 1.8 0 1 0-1.7 2.4l1.1 5.1c-2.2.1-4.2.7-5.7 1.7a2 2 0 1 0-2.7 2.9c-.1.4-.2.8-.2 1.2 0 3.1 3 5.5 6.7 5.5s6.7-2.4 6.7-5.5c0-.4-.1-.8-.2-1.2a2 2 0 1 0-2.7-2.9c-1.1-.7-2.5-1.2-4.1-1.5l-.9-4.1 4-.8a1.8 1.8 0 1 0-.2-1.2l-4.3.9-.3-1.2a1.8 1.8 0 0 0 .5-1.3ZM9 16.2a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm6 0a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm-6 2c1.8 1.4 4.2 1.4 6 0-.4 1.4-1.6 2.1-3 2.1s-2.6-.7-3-2.1Z" /></svg>;
  if (red.includes("twitch")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M4 2h18v13l-5 5h-4l-3 3H7v-3H2V5l2-3Zm1.5 3v12H9v3l3-3h4l3.5-3.5V5.1h-14ZM11 8h2v5h-2V8Zm5 0h2v5h-2V8Z" /></svg>;
  if (red.includes("discord")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M19.7 5.1A18 18 0 0 0 15.3 4l-.5 1a16 16 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.4 1.1C1.5 9.2.7 13.2 1.1 17.2a18 18 0 0 0 5.4 2.7l1.2-2a11 11 0 0 1-1.9-.9l.5-.4c3.7 1.7 7.7 1.7 11.3 0l.5.4a11 11 0 0 1-1.9.9l1.2 2a18 18 0 0 0 5.4-2.7c.5-4.7-.8-8.7-3.1-12.1ZM8.7 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" /></svg>;
  if (red.includes("spotify")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.8.8 0 0 1-1.1.3 10.9 10.9 0 0 0-8-.9.8.8 0 1 1-.4-1.5 12.4 12.4 0 0 1 9.2 1 .8.8 0 0 1 .3 1.1Zm1.2-2.8a1 1 0 0 1-1.3.4 13.4 13.4 0 0 0-9.5-1.2 1 1 0 1 1-.6-1.8 15.3 15.3 0 0 1 10.9 1.3 1 1 0 0 1 .5 1.3Zm.1-2.9a1.2 1.2 0 0 1-1.6.5 16.1 16.1 0 0 0-11-1.3 1.2 1.2 0 1 1-.7-2.2A18.4 18.4 0 0 1 17.4 9a1.2 1.2 0 0 1 .5 1.7Z" /></svg>;
  if (red.includes("snapchat")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 2.2c-2.2 0-3.8 1.8-3.8 4.5 0 .8.1 1.8.2 2.7-.5.4-1.2.5-1.8.2-.5-.2-1 .1-1.1.6-.1.5.3.9.8 1.1.5.2 1 .2 1.5.1-.8 1.7-2.3 3.2-4.4 3.8-.5.2-.6.8-.2 1.1.6.5 1.6.7 2.5.8.3 1 1 1.2 2 1 1.2-.2 2.2.2 3.2 1 .7.6 2.3.6 3 0 1-.8 2-1.2 3.2-1 1 .2 1.7 0 2-1 .9-.1 1.9-.3 2.5-.8.4-.3.3-.9-.2-1.1-2.1-.6-3.6-2.1-4.4-3.8.5.1 1 .1 1.5-.1.5-.2.9-.6.8-1.1-.1-.5-.6-.8-1.1-.6-.6.3-1.3.2-1.8-.2.1-.9.2-1.9.2-2.7 0-2.7-1.6-4.5-3.8-4.5Z" /></svg>;
  if (red.includes("threads")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.8 9.2c-.5-3.2-2.4-5-5.8-5-4 0-6.4 2.8-6.4 7.8 0 5.1 2.4 7.8 6.4 7.8 3.2 0 5.5-1.6 5.5-4.3 0-2.4-1.7-3.7-4.5-3.7-2.3 0-3.7 1-3.7 2.5 0 1.3.9 2.1 2.2 2.1 1.9 0 3.5-1.8 3.5-4.3 0-2.4-1.4-4.4-3.9-4.4-1.3 0-2.4.5-3.2 1.4" /></svg>;
  if (red.includes("bluesky")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M5 3.5c2.8 2.1 5.8 6.4 7 8.7 1.2-2.3 4.2-6.6 7-8.7 2-1.5 5.2-2.7 5.2 1 0 .8-.5 6.5-.8 7.4-.9 3.2-4.1 4-7 3.5 5.1.9 6.4 3.8 3.6 6.7-5.3 5.4-7.2-1.4-7.8-3.2-.1-.3-.2-.5-.2-.5s-.1.2-.2.5c-.6 1.8-2.5 8.6-7.8 3.2-2.8-2.9-1.5-5.8 3.6-6.7-2.9.5-6.1-.3-7-3.5C.5 10.9 0 5.2 0 4.5c0-3.7 3.2-2.5 5-1Z" transform="translate(2 1) scale(.83)" /></svg>;
  if (red.includes("soundcloud")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M1 13h1v5H1v-5Zm2-2h1v7H3v-7Zm2-2h1v9H5V9Zm2-2h1v11H7V7Zm2-1c1.2-1 2.8-1.5 4.4-1.2 2.6.5 4.5 2.8 4.5 5.5a4 4 0 0 1 1.2-.2A4 4 0 0 1 19 18H9V6Z" /></svg>;
  if (red.includes("vimeo")) return <span aria-hidden="true" className={`${className} inline-flex items-center justify-center font-serif text-xl font-bold italic`}>v</span>;
  if (red.includes("flickr")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><circle cx="8" cy="12" r="4" fill="currentColor" /><circle cx="16" cy="12" r="4" fill="currentColor" opacity=".55" /></svg>;
  if (red.includes("dribbble")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M7 4.5c4 3 7 7.5 9.5 14M3.5 9h17M5 17c4-4 9-5 15-3" /></svg>;
  if (red.includes("tumblr")) return <span aria-hidden="true" className={`${className} inline-flex items-center justify-center font-serif text-2xl font-bold`}>t</span>;
  if (red.includes("mastodon")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 2C6.4 2 3 2.8 2.4 7c-.4 2.7-.4 6.5.2 9.1.8 3.7 4.2 4.7 7.2 5.1 2 .2 3.8.1 5.5-.4l-.1-2.6c-1.6.5-3.4.7-5.2.4-1.8-.3-2.8-1.2-3-2.4 2.7.7 5.4.9 8.1.4 3.4-.6 5.4-2.5 5.8-5.6.2-1.7.2-4.9-.1-6.3C20 2.9 16.7 2 12 2Zm-3 10H6.4V7.5c0-2.5 3.2-2.7 4.3-.8l1.3 2.1 1.3-2.1c1.1-1.9 4.3-1.7 4.3.8V12h-2.6V8.4c0-.7-.8-.7-1.1-.1L12 10.8l-1.9-2.5c-.4-.6-1.1-.5-1.1.1V12Z" /></svg>;
  if (red.includes("patreon")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M3 2h3v20H3V2Zm13.2 0a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z" /></svg>;
  if (red.includes("wechat")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M9.5 3C5.4 3 2 5.7 2 9c0 1.8 1 3.5 2.6 4.6L4 16l2.8-1.3c.8.2 1.7.3 2.7.3h.3a5.7 5.7 0 0 1-.3-1.8c0-3.7 3.5-6.7 7.8-6.7h.6C16.7 4.5 13.4 3 9.5 3Zm-3 5.1a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.3 0c-3.4 0-6.2 2.2-6.2 4.9s2.8 4.9 6.2 4.9c.8 0 1.5-.1 2.2-.3l2.3 1.1-.5-2.1c1.3-.9 2.1-2.2 2.1-3.6 0-2.7-2.8-4.9-6.1-4.9Zm-2.5 4.1a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm5 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Z" /></svg>;
  if (red === "vk" || red.includes("vkontakte")) return <span aria-hidden="true" className={`${className} inline-flex items-center justify-center text-[11px] font-black`}>VK</span>;
  if (red.includes("github")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 .8A11.2 11.2 0 0 0 8.5 22.6c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.6-1.2-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.4-5.5-6.2 0-1.4.5-2.6 1.2-3.5-.1-.3-.5-1.6.1-3.4 0 0 1-.3 3.6 1.3a12.6 12.6 0 0 1 6.6 0c2.5-1.6 3.6-1.3 3.6-1.3.7 1.8.3 3.1.1 3.4.8.9 1.2 2.1 1.2 3.5 0 4.8-2.8 5.9-5.5 6.2.4.3.8 1 .8 2v3c0 .3.2.6.8.5A11.2 11.2 0 0 0 12 .8Z" /></svg>;
  if (red.includes("substack")) return <span aria-hidden="true" className={`${className} inline-flex items-center justify-center font-serif text-xl font-bold`}>S</span>;
  if (red.includes("bandcamp")) return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M9 5h13l-7 14H2L9 5Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18" /></svg>;
}

export default function Home() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);
  const [categoria, setCategoria] = useState("Todas");
  const [disponibilidad, setDisponibilidad] = useState("Todas");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const filtrosRef = useRef<HTMLDivElement | null>(null);
  const [aviso, setAviso] = useState("");
  const [perfil, setPerfil] = useState<PerfilArtista>({ nombre: "Yasiel Pérez Díaz", biografia: "Pintor, grabador, ilustrador y escultor. Un lenguaje visual que transita entre la materia, la memoria y la emoción.", whatsapp: "", redes: [] });
  const [fotoArtistaUrl, setFotoArtistaUrl] = useState("");
  const inicioToque = useRef<number | null>(null);

  useEffect(() => {
    async function cargarObras() {
      try {
        const consulta = await getDocs(collection(db, "obras"));
        setObras(consulta.docs.map((documento) => {
          const datos = documento.data();
          return {
            id: documento.id, titulo: datos.titulo || "", tecnica: datos.tecnica || "",
            dimensiones: datos.dimensiones || "", anio: datos.anio || "", descripcion: datos.descripcion || "",
            imagenUrl: datos.imagenUrl || "", audioUrl: datos.audioUrl || "", categoria: datos.categoria || "Pintura",
            precio: datos.precio || "", disponible: datos.disponible ?? true,
          };
        }));
      } catch (error) { console.error("Error cargando las obras:", error); }
      finally { setCargando(false); }
    }
    cargarObras();
  }, []);

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const resultado = await getDoc(doc(db, "configuracion", "artista"));
        if (resultado.exists()) {
          const datos = resultado.data();
          const redesGuardadas = datos.redes;
          const redes = Array.isArray(redesGuardadas)
            ? redesGuardadas
            : Object.entries(redesGuardadas || {}).map(([nombre, url]) => ({ nombre, url: String(url) }));
          setPerfil({ nombre: datos.nombre || "Yasiel Pérez Díaz", biografia: datos.biografia || "", whatsapp: datos.whatsapp || "", redes });
          setFotoArtistaUrl(datos.fotoUrl || "");
        }
      } catch (error) { console.error("Error cargando la ficha del artista:", error); }
    }
    cargarPerfil();
  }, []);

  useEffect(() => {
    const idCompartido = window.location.hash.startsWith("#obra=") ? window.location.hash.slice(6) : "";
    if (idCompartido && obras.length) {
      const compartida = obras.find((obra) => obra.id === idCompartido);
      if (compartida) setObraSeleccionada(compartida);
    }
  }, [obras]);

  useEffect(() => {
    if (!filtrosAbiertos) return;
    function cerrarAlSalir(event: PointerEvent) {
      if (filtrosRef.current && !filtrosRef.current.contains(event.target as Node)) setFiltrosAbiertos(false);
    }
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltrosAbiertos(false);
    }
    document.addEventListener("pointerdown", cerrarAlSalir);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAlSalir);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [filtrosAbiertos]);

  const obrasFiltradas = useMemo(() => obras.filter((obra) => {
    const coincideCategoria = categoria === "Todas" || obra.categoria === categoria;
    const coincideDisponibilidad = disponibilidad === "Todas" || (disponibilidad === "Disponibles" ? obra.disponible : !obra.disponible);
    return coincideCategoria && coincideDisponibilidad;
  }), [categoria, disponibilidad, obras]);

  async function compartir(obra: Obra) {
    const url = `${window.location.origin}/#obra=${obra.id}`;
    try {
      if (navigator.share) await navigator.share({ title: obra.titulo, text: `Descubre “${obra.titulo}” de Yass`, url });
      else { await navigator.clipboard.writeText(url); setAviso("Enlace copiado"); window.setTimeout(() => setAviso(""), 2200); }
    } catch { /* El usuario puede cerrar el diálogo de compartir. */ }
  }

  async function compartirPagina() {
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: "Yass — Estudio de arte", text: "Descubre la galería de Yasiel Pérez Díaz.", url });
      else { await navigator.clipboard.writeText(url); setAviso("Enlace de la página copiado"); window.setTimeout(() => setAviso(""), 2200); }
    } catch { /* El usuario puede cerrar el diálogo de compartir. */ }
  }

  function cambiarObra(paso: number) {
    if (!obraSeleccionada || obras.length < 2) return;
    const indice = obras.findIndex((obra) => obra.id === obraSeleccionada.id);
    const siguiente = obras[(indice + paso + obras.length) % obras.length];
    setObraSeleccionada(siguiente);
    window.history.replaceState(null, "", `#obra=${siguiente.id}`);
  }

  function enlaceWhatsApp(obra: Obra) {
    const mensaje = encodeURIComponent(`Hola, quisiera ${obra.disponible ? "consultar o comprar" : "consultar"} la obra “${obra.titulo}” de Yass.`);
    const numero = perfil.whatsapp.replace(/\D/g, "");
    return `https://wa.me/${numero}?text=${mensaje}`;
  }

  const enlaceWhatsAppArtista = `https://wa.me/${perfil.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hola me gustaría saber un poco más de su obra")}`;

  return (
    <main className="site-shell min-h-screen overflow-x-hidden bg-[#080909] text-[#f4efe7]">
      <header className="site-header sticky top-0 z-40 border-b border-white/10 bg-[#080909]/95 px-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between">
          <a href="#inicio" className="brand-lockup" aria-label="Estudio de Arte Yass, inicio"><span className="brand-mark">Y</span><span><small>ESTUDIO DE ARTE</small><strong>YASS</strong></span></a>
          <a href="/admin" className="admin-link">♙ <span>Admin</span></a>
        </div>
      </header>
      <section id="inicio" className="hero-art flex min-h-[76svh] flex-col justify-center px-6 py-24 sm:px-10 md:min-h-[82svh] md:px-20">
        <div className="mx-auto w-full max-w-7xl">
          <div className="hero-copy"><p className="eyebrow">ESTUDIO DE ARTE</p>
          <h1 className="mt-3 text-7xl font-semibold tracking-[0.12em] sm:text-8xl md:text-[7.5rem]">YASS</h1>
          <div className="my-7 h-1 w-14 bg-[#f3262e]" />
          <p className="hero-meta">PINTURA　·　GRABADO　·　ILUSTRACIÓN　·　ESCULTURA</p><p className="hero-intro">El arte como un espacio de encuentro<br/> entre lo que vemos y lo que sentimos.</p>
          <a href="#galeria" className="hero-button">ENTRAR A LA GALERÍA　→</a></div>
        </div>
        <span className="absolute bottom-9 right-8 hidden text-[10px] tracking-[0.28em] text-[#8e857a] md:block">OBRA ORIGINAL · HECHA A MANO</span>
      </section>

      <section id="galeria" className="gallery-section scroll-mt-4 px-5 py-14 sm:px-8 sm:py-20 md:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="section-heading mb-7"><div><p className="eyebrow">COLECCIÓN</p><h2 className="mt-2 text-3xl font-medium tracking-wide">Galería</h2><p className="mt-1 text-sm text-white/60">Cada obra es una historia, escúchala.</p></div></div><div className="mb-8" ref={filtrosRef}>
            <div className="relative inline-block">
              <button type="button" onClick={() => setFiltrosAbiertos((abierto) => !abierto)} aria-expanded={filtrosAbiertos} aria-controls="menu-filtros-obras" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[#5a5046] bg-[#191714] px-5 text-sm text-[#e8dfd4] shadow-sm transition-all duration-300 hover:border-[#bf775f] hover:bg-[#211e1a]">
                <IconoFiltro /> <span>Filtrar obras</span>
                {(categoria !== "Todas" || disponibilidad !== "Todas") && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#bf775f] px-1.5 text-[11px] font-medium text-[#11100f]">{Number(categoria !== "Todas") + Number(disponibilidad !== "Todas")}</span>}
                <span aria-hidden="true" className={`ml-1 text-xs transition-transform duration-300 ${filtrosAbiertos ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {filtrosAbiertos && <div id="menu-filtros-obras" className="filter-menu absolute left-0 top-[calc(100%+0.65rem)] z-30 w-[min(21rem,calc(100vw-2.5rem))] rounded-2xl border border-[#484139] bg-[#191714] p-5 shadow-2xl shadow-black/40 animate-reveal">
                <div className="mb-5 flex items-center justify-between"><p className="font-serif text-lg">Filtrar colección</p><button type="button" onClick={() => { setCategoria("Todas"); setDisponibilidad("Todas"); }} className="rounded-full px-3 py-2 text-xs text-[#bfaa96] transition-colors hover:bg-white/[0.06] hover:text-white">Limpiar</button></div>
                <fieldset><legend className="mb-2 text-[10px] uppercase tracking-[0.17em] text-[#938a7f]">Categoría</legend><div className="grid grid-cols-2 gap-2">{categorias.map((item) => <button type="button" key={item} aria-pressed={categoria === item} onClick={() => setCategoria(item)} className={`min-h-10 rounded-xl border px-3 text-left text-xs transition-all duration-200 ${categoria === item ? "border-[#bf775f]/70 bg-[#bf775f]/15 text-[#e4b19a]" : "border-transparent text-[#c8c0b5] hover:border-[#484139] hover:bg-white/[0.035]"}`}>{item}</button>)}</div></fieldset>
                <fieldset className="mt-5 border-t border-white/[0.07] pt-4"><legend className="mb-2 text-[10px] uppercase tracking-[0.17em] text-[#938a7f]">Disponibilidad</legend><div className="space-y-1">{[["Todas", "Todas las obras"], ["Disponibles", "Disponibles para comprar"], ["Vendidas", "Vendidas"]].map(([valor, etiqueta]) => <button type="button" key={valor} aria-pressed={disponibilidad === valor} onClick={() => setDisponibilidad(valor)} className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs transition-all duration-200 ${disponibilidad === valor ? "bg-[#bf775f]/15 text-[#e4b19a]" : "text-[#c8c0b5] hover:bg-white/[0.035]"}`}><span className={`grid h-4 w-4 place-items-center rounded-full border ${disponibilidad === valor ? "border-[#bf8871]" : "border-[#63594e]"}`}>{disponibilidad === valor && <span className="h-2 w-2 rounded-full bg-[#bf8871]" />}</span>{etiqueta}</button>)}</div></fieldset>
              </div>}
            </div>
            {(categoria !== "Todas" || disponibilidad !== "Todas") && <span className="ml-3 text-xs text-[#938a7f]">{obrasFiltradas.length} {obrasFiltradas.length === 1 ? "obra" : "obras"}</span>}
          </div>
          {cargando ? <p className="text-[#938a7f]">Cargando obras...</p> : obrasFiltradas.length === 0 ? <p className="py-12 text-[#938a7f]">{obras.length ? "No hay obras con estos filtros." : "Próximamente, nuevas obras."}</p> :
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
              {obrasFiltradas.map((obra, indice) => <article key={obra.id} className="art-card group animate-reveal transition-all duration-500" style={{ animationDelay: `${Math.min(indice, 8) * 70}ms` }}>
                <button onClick={() => setObraSeleccionada(obra)} className="block w-full text-left" aria-label={`Ver ${obra.titulo}`}>
                  <div className="relative aspect-[1.12/1] overflow-hidden bg-[#211e1a]">
                    {obra.imagenUrl && <img src={obra.imagenUrl} alt={obra.titulo} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />}
                    <span className="absolute left-4 top-4 rounded-full bg-[#11100f]/75 px-3 py-2 text-[10px] uppercase tracking-[0.16em] backdrop-blur">{obra.categoria}</span>
                    <span className={`absolute right-4 top-4 rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.12em] ${obra.disponible ? "bg-[#e9e1d5] text-[#28231e]" : "bg-[#37332f] text-[#d2c8bb]"}`}>{obra.disponible ? "Disponible" : "Vendida"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-2">
                    <div><h3 className="text-sm font-medium sm:text-base">{obra.titulo}</h3><p className="mt-1 text-[10px] text-white/60 sm:text-xs">{obra.tecnica}{obra.dimensiones ? ` · ${obra.dimensiones}` : ""}{obra.anio ? ` · ${obra.anio}` : ""}</p></div>
                    <span className="shrink-0 pt-1 text-sm text-[#d2a08c]">{obra.precio ? `$${obra.precio}` : "Consultar"}</span>
                  </div>
                </button>
                <div className="mt-3 flex gap-2">
                  <a href={enlaceWhatsApp(obra)} target="_blank" rel="noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#d6c6ae] px-3 text-center text-[10px] font-medium tracking-[0.12em] text-[#211e1a] transition-all duration-300 hover:bg-[#bf775f]">{obra.disponible ? "COMPRAR / CONSULTAR" : "CONSULTAR OBRA"}</a>
                  <button onClick={() => compartir(obra)} aria-label={`Compartir ${obra.titulo}`} className="grid min-h-11 min-w-12 place-items-center rounded-full border border-[#484139] text-[#d6c6ae] transition-all duration-300 hover:border-[#bf775f] hover:bg-[#bf775f]/10" title="Compartir"><IconoCompartir /></button>
                </div>
              </article>)}
            </div>}
        </div>
      </section>

      <section id="artista" className="scroll-mt-8 border-y border-[#312d28] bg-[#191714] px-6 py-20 sm:py-28 md:px-16">
        <div className="mx-auto flex max-w-4xl flex-col gap-7 sm:flex-row sm:items-start sm:gap-10">{fotoArtistaUrl && <img src={fotoArtistaUrl} alt={`Retrato de ${perfil.nombre}`} loading="lazy" className="h-36 w-36 shrink-0 rounded-full border border-[#484139] object-cover sm:h-44 sm:w-44" />}<div><p className="eyebrow">EL ARTISTA</p><h2 className="display-title mt-4 text-4xl font-light sm:text-6xl">{perfil.nombre}</h2>{perfil.biografia && <p className="mt-7 max-w-2xl whitespace-pre-line font-serif text-lg leading-relaxed text-[#b9b0a5] sm:text-xl">{perfil.biografia}</p>}<div className="mt-8 flex flex-wrap gap-3">{perfil.redes.filter((red) => red.url?.trim()).map((red, indice) => <a key={`${red.nombre}-${indice}`} href={red.url} target="_blank" rel="noreferrer" aria-label={red.nombre} title={red.nombre} className="grid h-12 w-12 place-items-center border border-[#484139] text-[#d6c6ae] transition hover:border-[#bf775f] hover:bg-[#bf775f]/10 hover:text-white"><IconoRed nombre={red.nombre} /></a>)}</div></div></div>
      </section>

      {obraSeleccionada && <div className="fixed inset-0 z-50 overflow-y-auto bg-[#100f0e]/90 backdrop-blur-md" onClick={() => setObraSeleccionada(null)}>
        <div className="flex min-h-[100svh] items-start justify-center p-4 sm:p-8 md:items-center" onClick={(event) => event.stopPropagation()}>
          <div className="my-auto w-full max-w-6xl animate-reveal">
            <div className="mb-3 flex justify-end"><button onClick={() => setObraSeleccionada(null)} aria-label="Cerrar" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-3xl text-[#b9b0a5] transition-colors hover:border-white/30 hover:text-white">×</button></div>
            <div className="grid items-center gap-7 md:grid-cols-2 md:gap-12" style={{ touchAction: "pan-y" }} onTouchStart={(event) => { inicioToque.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (inicioToque.current !== null) { const delta = event.changedTouches[0].clientX - inicioToque.current; if (Math.abs(delta) > 48) cambiarObra(delta < 0 ? 1 : -1); } inicioToque.current = null; }}>
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#201d19]"><img src={obraSeleccionada.imagenUrl} alt={obraSeleccionada.titulo} className="max-h-[58vh] w-full object-contain md:max-h-[78vh]" />{obras.length > 1 && <><button onClick={() => cambiarObra(-1)} aria-label="Obra anterior" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-2xl text-white backdrop-blur transition-all hover:scale-105 hover:bg-[#bf775f]">‹</button><button onClick={() => cambiarObra(1)} aria-label="Obra siguiente" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-2xl text-white backdrop-blur transition-all hover:scale-105 hover:bg-[#bf775f]">›</button></>}</div>
              <div className="pb-8">
                <p className="eyebrow">{obraSeleccionada.categoria} · {obraSeleccionada.disponible ? "DISPONIBLE" : "VENDIDA"}</p>
                <h2 className="display-title mt-4 text-4xl font-light leading-tight sm:text-6xl">{obraSeleccionada.titulo}</h2>
                <p className="mt-4 font-serif text-2xl text-[#d2a08c]">{obraSeleccionada.precio ? `$${obraSeleccionada.precio}` : "Precio a consultar"}</p>
                <div className="my-6 h-px w-14 bg-[#bf775f]" />
                <dl className="space-y-2 text-sm text-[#b9b0a5]">{[["Técnica", obraSeleccionada.tecnica], ["Dimensiones", obraSeleccionada.dimensiones], ["Año", obraSeleccionada.anio]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="inline text-[#f4efe7]">{label}: </dt><dd className="inline">{value}</dd></div>)}</dl>
                {obraSeleccionada.descripcion && <p className="mt-6 text-sm leading-relaxed text-[#b9b0a5]">{obraSeleccionada.descripcion}</p>}
                {obraSeleccionada.audioUrl && <div className="audio-panel mt-7 p-4 sm:p-5"><div className="mb-3 flex items-center gap-3"><span className="audio-glyph">♫</span><div><p className="text-[10px] tracking-[0.17em] text-[#d2a08c]">PAISAJE SONORO</p><p className="mt-1 font-serif text-sm">Escucha esta obra</p></div></div><audio controls preload="none" src={obraSeleccionada.audioUrl} className="art-audio w-full" /></div>}
                <div className="mt-7 flex gap-3"><a href={enlaceWhatsApp(obraSeleccionada)} target="_blank" rel="noreferrer" className="flex min-h-12 flex-1 items-center justify-center bg-[#d6c6ae] px-4 text-center text-xs tracking-[0.12em] text-[#211e1a] transition hover:bg-[#bf775f]">{obraSeleccionada.disponible ? "COMPRAR / CONSULTAR OBRA" : "CONSULTAR OBRA"}</a><button onClick={() => compartir(obraSeleccionada)} className="grid min-h-12 min-w-14 place-items-center border border-[#484139] text-[#d6c6ae] hover:border-[#bf775f]" aria-label="Compartir obra" title="Compartir obra"><IconoCompartir /></button></div>
              </div>
            </div>
          </div>
        </div>
      </div>}
      {aviso && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 bg-[#e9e1d5] px-5 py-3 text-sm text-[#211e1a]">{aviso}</div>}
      <a href={enlaceWhatsAppArtista} target="_blank" rel="noreferrer" aria-label="Contactar al artista por WhatsApp" title="Contactar al artista por WhatsApp" className="whatsapp-float fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl transition hover:scale-105 sm:bottom-7 sm:right-7 sm:h-16 sm:w-16"><svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-current sm:h-8 sm:w-8"><path d="M16 3a12.8 12.8 0 0 0-10.9 19.5L3.4 29l6.7-1.7A12.9 12.9 0 1 0 16 3Zm0 23.4c-2 0-3.9-.5-5.6-1.6l-.4-.2-4 .9 1-3.9-.3-.4a10.5 10.5 0 1 1 9.3 5.2Zm5.8-7.9c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.5 5.5 4.8.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z" /></svg></a>
      <footer id="contacto" className="site-footer flex flex-col gap-4 px-6 py-6 text-xs tracking-wide sm:flex-row sm:items-center sm:justify-between md:px-12"><a href="#inicio" className="brand-lockup"><span className="brand-mark">Y</span><strong>ESTUDIO DE ARTE YASS</strong></a><span className="hidden uppercase tracking-[0.2em] text-white/65 sm:block">Pintura　·　Grabado　·　Ilustración　·　Escultura</span><div className="flex items-center gap-5"><button onClick={compartirPagina} aria-label="Compartir página" className="text-white hover:text-[#f3262e]"><IconoCompartir /></button><span>© 2026</span></div></footer>
    </main>
  );
}
