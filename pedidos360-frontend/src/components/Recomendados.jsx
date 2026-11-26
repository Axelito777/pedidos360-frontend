import { useEffect, useState } from "react";
import { obtenerRecomendaciones } from "../api/analyticsApi";
import { usuarioActualId } from "../utils/bloqueo";

// Los eventos viajan por Kafka (productos/carrito -> user-events -> ms-analytics), así que tardan un poco:
// tras cada interacción se pide ahora y se reintenta a los 2 y a los 5 segundos.
const RETRASOS_MS = [0, 2000, 5000];
// Cuánto dura el resaltado de las tarjetas nuevas
const DURACION_RESALTADO_MS = 4000;

// Última lista recibida, guardada fuera del componente: el catálogo y el detalle montan cada uno su
// sección, y así la nueva arranca sin "Cargando..." y puede resaltar lo que cambió respecto de la anterior.
let ultimaLista = null;

// "Recomendados para ti". Se vuelve a pedir cada vez que cambia interaccionVersion
// (ver un detalle, agregar al carrito o terminar una compra).
function Recomendados({ interaccionVersion, onVerDetalle, productoActualId }) {
  const [productos, setProductos] = useState(() => ultimaLista); // null = cargando
  const [error, setError] = useState(false);
  const [nuevos, setNuevos] = useState(() => new Set()); // ids que acaban de aparecer
  const userId = usuarioActualId(); // oid del token (la misma key que usa Kafka en user-events)

  useEffect(() => {
    if (!userId) return;
    let activo = true; // evita actualizar si cambió la interacción o se desmontó
    const timers = RETRASOS_MS.map((ms) =>
      setTimeout(async () => {
        try {
          const respuesta = await obtenerRecomendaciones(userId);
          if (!activo) return;
          const lista = respuesta.productos || [];
          const ids = lista.map((p) => p.productId);
          const anteriores = ultimaLista ? ultimaLista.map((p) => p.productId) : null;
          if (anteriores && ids.join() === anteriores.join()) return; // nada cambió
          // Se resaltan solo los que no estaban (en la primera carga no se resalta nada)
          setNuevos(new Set(anteriores ? ids.filter((id) => !anteriores.includes(id)) : []));
          ultimaLista = lista;
          setProductos(lista);
          setError(false);
        } catch {
          // Si ya había recomendaciones se mantienen; si nunca cargaron, la sección se oculta
          if (activo && ultimaLista === null) setError(true);
        }
      }, ms)
    );
    return () => {
      activo = false;
      timers.forEach(clearTimeout);
    };
  }, [interaccionVersion, userId]);

  // El resaltado se apaga solo
  useEffect(() => {
    if (nuevos.size === 0) return;
    const t = setTimeout(() => setNuevos(new Set()), DURACION_RESALTADO_MS);
    return () => clearTimeout(t);
  }, [nuevos]);

  if (error || !userId) return null; // error: la sección desaparece sin romper la página

  // En el detalle no se recomienda el mismo reloj que se está viendo
  const visibles = (productos || []).filter((p) => p.productId !== productoActualId);

  return (
    <section className="mb-16">
      <h2 className="text-xl sm:text-2xl font-black text-white mb-6 tracking-widest uppercase">
        Recomendados <span className="text-[#D4AF37]">para ti</span>
      </h2>

      {productos === null && (
        <p className="text-gray-500 text-sm tracking-wide">Cargando recomendaciones...</p>
      )}

      {productos !== null && visibles.length === 0 && (
        <p className="text-gray-500 text-sm tracking-wide">
          Mira algunos productos y te recomendaremos.
        </p>
      )}

      {visibles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {visibles.map((p) => {
            const esNuevo = nuevos.has(p.productId);
            return (
              <button
                key={p.productId}
                type="button"
                onClick={() => onVerDetalle(p.productId)} // abrir el detalle genera un nuevo evento
                className={`group text-left bg-neutral-900/40 border rounded-xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:border-[#D4AF37]/60 ${
                  esNuevo ? "animar-nuevo border-[#D4AF37] ring-2 ring-[#D4AF37]/40" : "border-neutral-800/80"
                }`}
              >
                <div className="relative w-full aspect-square bg-neutral-950/80 flex items-center justify-center p-4">
                  {esNuevo && (
                    <span className="absolute top-2 left-2 bg-[#D4AF37] text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded">
                      Nuevo
                    </span>
                  )}
                  {p.imagenUrl ? (
                    <img
                      src={p.imagenUrl}
                      alt={p.nombre || "Reloj"}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-3xl">⌚</span>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <span className="text-sm font-bold text-white tracking-wide leading-tight">
                    {p.nombre || `${p.brand || "Reloj"} #${p.productId}`}
                  </span>
                  {p.precio != null && (
                    <span className="text-sm font-black text-white">
                      ${Number(p.precio).toLocaleString("es-CL")}
                    </span>
                  )}
                  {p.motivo && <span className="text-[11px] text-[#D4AF37]/80 leading-snug">{p.motivo}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Recomendados;
