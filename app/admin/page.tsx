"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getFirestore,
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

type Obra = {
  id: string;
  titulo: string;
  tecnica: string;
  dimensiones: string;
  anio: string;
  descripcion: string;
  imagenUrl: string;
  audioUrl: string;
};

export default function AdminPage() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const [titulo, setTitulo] = useState("");
  const [tecnica, setTecnica] = useState("");
  const [dimensiones, setDimensiones] = useState("");
  const [anio, setAnio] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [imagen, setImagen] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [obraEditando, setObraEditando] = useState<Obra | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTecnica, setEditTecnica] = useState("");
  const [editDimensiones, setEditDimensiones] = useState("");
  const [editAnio, setEditAnio] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargandoUsuario(false);
    });

    return () => cancelar();
  }, []);

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
    setObraEditando(obra);

    setEditTitulo(obra.titulo);
    setEditTecnica(obra.tecnica);
    setEditDimensiones(obra.dimensiones);
    setEditAnio(obra.anio);
    setEditDescripcion(obra.descripcion);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  function cancelarEdicion() {
    setObraEditando(null);
  }

  async function guardarEdicion() {
    if (!obraEditando) {
      return;
    }

    try {
      await updateDoc(doc(db, "obras", obraEditando.id), {
        titulo: editTitulo,
        tecnica: editTecnica,
        dimensiones: editDimensiones,
        anio: editAnio,
        descripcion: editDescripcion,
      });

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
              }
            : obra
        )
      );

      setObraEditando(null);
      setMensaje("Obra actualizada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo actualizar la obra.");
    }
  }

  async function subirArchivo(
    archivo: File,
    tipo: "image" | "raw"
  ) {
    const formData = new FormData();

    formData.append("file", archivo);
    formData.append("upload_preset", "galeria_arte_yass");

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/emd4nyab/${tipo}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo subir el archivo a Cloudinary.");
    }

    const datos = await respuesta.json();

    return datos.secure_url;
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

    if (!audio) {
      setMensaje("Selecciona un audio para la obra.");
      return;
    }

    try {
      setSubiendo(true);
      setMensaje("Subiendo imagen...");

      const imagenUrl = await subirArchivo(imagen, "image");

      setMensaje("Imagen subida. Subiendo audio...");

      const audioUrl = await subirArchivo(audio, "raw");

      setMensaje("Guardando obra...");

      await addDoc(collection(db, "obras"), {
        titulo,
        tecnica,
        dimensiones,
        anio,
        descripcion,
        imagenUrl,
        audioUrl,
        nombreImagen: imagen.name,
        nombreAudio: audio.name,
        fechaCreacion: new Date().toISOString(),
      });

      setMensaje("¡Obra guardada correctamente!");

      setTitulo("");
      setTecnica("");
      setDimensiones("");
      setAnio("");
      setDescripcion("");
      setImagen(null);
      setAudio(null);

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

        <div className="border border-zinc-800 p-6 md:p-10">

          <h2 className="text-2xl font-light mb-8">
            Agregar nueva obra
          </h2>

          <div className="space-y-6">

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

              <input
                value={tecnica}
                onChange={(e) => setTecnica(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Óleo sobre lienzo"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Dimensiones
              </label>

              <input
                value={dimensiones}
                onChange={(e) => setDimensiones(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="70 × 45 cm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Año
              </label>

              <input
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="2026"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Descripción
              </label>

              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                placeholder="Descripción de la obra"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Imagen de la obra
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImagen(e.target.files?.[0] || null)
                }
                className="w-full text-sm text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Audio de la obra
              </label>

              <input
                type="file"
                accept="audio/*"
                onChange={(e) =>
                  setAudio(e.target.files?.[0] || null)
                }
                className="w-full text-sm text-gray-400"
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

                  <img
                    src={obra.imagenUrl}
                    alt={obra.titulo}
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

        {obraEditando && (
          <div className="mt-12 border border-zinc-700 p-6 md:p-10">

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

                <input
                  value={editTecnica}
                  onChange={(e) => setEditTecnica(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 outline-none focus:border-red-500"
                />
              </div>

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

              <div className="flex gap-3">

                <button
                  onClick={guardarEdicion}
                  className="bg-white text-black px-6 py-3 hover:bg-gray-200 transition"
                >
                  GUARDAR CAMBIOS
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