"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

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

export default function Home() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);

  useEffect(() => {
    async function cargarObras() {
      try {
        const consulta = await getDocs(collection(db, "obras"));

        const obrasFirebase: Obra[] = consulta.docs.map((doc) => {
          const datos = doc.data();

          return {
            id: doc.id,
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
        console.error("Error cargando las obras:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarObras();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* PORTADA */}

      <section className="min-h-[100svh] flex flex-col justify-center px-6 sm:px-8 md:px-20">

        <div className="max-w-6xl">

          <p className="text-red-500 tracking-[0.3em] sm:tracking-[0.4em] text-xs sm:text-sm mb-5 sm:mb-6">
            ESTUDIO DE ARTE
          </p>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-light tracking-tight">
            YASS
          </h1>

          <div className="w-16 sm:w-24 h-1 bg-red-500 mt-6 sm:mt-8 mb-6 sm:mb-8"></div>

          <p className="text-gray-400 text-base sm:text-lg md:text-2xl max-w-xl leading-relaxed">
            Pintura, grabado, ilustración y escultura.
          </p>

          <a
            href="#galeria"
            className="inline-flex items-center justify-center mt-10 sm:mt-12 border border-white px-6 sm:px-8 py-4 min-h-14 text-sm sm:text-base hover:bg-white hover:text-black active:bg-white active:text-black transition"
          >
            ENTRAR A LA GALERÍA
          </a>

        </div>

      </section>


      {/* GALERÍA */}

      <section
        id="galeria"
        className="px-5 sm:px-6 md:px-16 py-16 sm:py-20 md:py-24"
      >

        <div className="max-w-7xl mx-auto">

          <p className="text-red-500 text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em]">
            COLECCIÓN
          </p>

          <h2 className="text-4xl sm:text-5xl md:text-6xl mt-3 font-light mb-10 sm:mb-12">
            Obras
          </h2>


          {cargando ? (

            <p className="text-gray-500">
              Cargando obras...
            </p>

          ) : obras.length === 0 ? (

            <p className="text-gray-500">
              No hay obras disponibles todavía.
            </p>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-8">

              {obras.map((obra) => (

                <button
                  key={obra.id}
                  onClick={() => setObraSeleccionada(obra)}
                  className="group text-left w-full active:scale-[0.99] transition"
                >

                  <div className="aspect-[4/5] bg-zinc-900 overflow-hidden">

                    <img
                      src={obra.imagenUrl}
                      alt={obra.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    />

                  </div>

                  <div className="mt-4 sm:mt-5">

                    <h3 className="text-lg sm:text-xl">
                      {obra.titulo}
                    </h3>

                    <p className="text-gray-500 text-sm mt-2">
                      {obra.tecnica}
                    </p>

                    <p className="text-gray-600 text-sm">
                      {obra.dimensiones} · {obra.anio}
                    </p>

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

      </section>


      {/* SOBRE EL ARTISTA */}

      <section className="border-t border-zinc-800 px-5 sm:px-6 md:px-16 py-16 sm:py-20 md:py-24">

        <div className="max-w-4xl mx-auto">

          <p className="text-red-500 text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em]">
            EL ARTISTA
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-light mt-4">
            Yasiel Pérez Díaz
          </h2>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mt-6 sm:mt-8">
            Pintor, grabador, ilustrador y escultor.
          </p>

        </div>

      </section>


      {/* VENTANA DE LA OBRA */}

      {obraSeleccionada && (

        <div
          className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
          onClick={() => setObraSeleccionada(null)}
        >

          <div
            className="min-h-[100svh] flex items-start md:items-center justify-center p-4 sm:p-6 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="w-full max-w-6xl py-4 sm:py-6 md:py-0">

              {/* BOTÓN CERRAR */}

              <div className="flex justify-end mb-3 sm:mb-6">

                <button
                  onClick={() => setObraSeleccionada(null)}
                  aria-label="Cerrar"
                  className="flex items-center justify-center w-12 h-12 text-gray-400 hover:text-white active:text-white text-3xl"
                >
                  ×
                </button>

              </div>


              <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start md:items-center">


                {/* IMAGEN */}

                <div className="bg-zinc-900 w-full">

                  <img
                    src={obraSeleccionada.imagenUrl}
                    alt={obraSeleccionada.titulo}
                    className="w-full max-h-[55vh] md:max-h-[75vh] object-contain"
                  />

                </div>


                {/* INFORMACIÓN */}

                <div className="pb-8">

                  <p className="text-red-500 text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] mb-3 sm:mb-4">
                    OBRA
                  </p>

                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-light leading-tight">
                    {obraSeleccionada.titulo}
                  </h2>

                  <div className="w-12 sm:w-16 h-1 bg-red-500 mt-5 sm:mt-6 mb-6 sm:mb-8"></div>


                  <div className="space-y-3 text-gray-400 text-sm sm:text-base">

                    <p>
                      <span className="text-white">
                        Técnica:
                      </span>{" "}
                      {obraSeleccionada.tecnica}
                    </p>

                    <p>
                      <span className="text-white">
                        Dimensiones:
                      </span>{" "}
                      {obraSeleccionada.dimensiones}
                    </p>

                    <p>
                      <span className="text-white">
                        Año:
                      </span>{" "}
                      {obraSeleccionada.anio}
                    </p>

                  </div>


                  {obraSeleccionada.descripcion && (

                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed mt-6 sm:mt-8">
                      {obraSeleccionada.descripcion}
                    </p>

                  )}


                  {obraSeleccionada.audioUrl && (

                    <div className="mt-8 sm:mt-10">

                      <p className="text-xs sm:text-sm text-gray-500 mb-3 tracking-wide">
                        ESCUCHAR LA OBRA
                      </p>

                      <audio
                        controls
                        src={obraSeleccionada.audioUrl}
                        className="w-full max-w-full"
                      />

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* FOOTER */}

      <footer className="border-t border-zinc-800 px-5 sm:px-6 md:px-16 py-8 sm:py-10">

        <div className="max-w-7xl mx-auto">

          <p className="text-gray-500 text-sm">
            ESTUDIO DE ARTE YASS
          </p>

          <p className="text-gray-600 text-sm mt-2">
            © 2026
          </p>

        </div>

      </footer>

    </main>
  );
}