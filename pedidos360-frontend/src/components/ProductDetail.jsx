import { useEffect, useState } from "react";
import { getProductoPorId } from "../api/productosApi";
import { agregarAlCarrito } from "../utils/agregarAlCarrito";

// Detalle de un reloj. Pide GET /productos/{id} para que el backend registre PRODUCT_VIEWED
function ProductDetail({ productoId, cartId, setCartId, onCartChange, onVolver }) {
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    let activo = true; // evita actualizar si el componente se desmontó
    getProductoPorId(productoId)
      .then((p) => activo && setProducto(p))
      .catch((e) =>
        activo && setError(e.response?.status === 404 ? "Este reloj ya no existe." : e.message)
      );
    return () => {
      activo = false;
    };
  }, [productoId]);

  const handleAgregar = async () => {
    if (agregando) return;
    setAgregando(true);
    try {
      await agregarAlCarrito(producto, cartId, setCartId);
      onCartChange();
      setAgregado(true);
    } catch (e) {
      alert("Error al agregar: " + e.message);
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="mb-16">
      <button
        type="button"
        onClick={onVolver}
        className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-[#D4AF37] transition-colors mb-8 cursor-pointer"
      >
        &larr; Volver al catálogo
      </button>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {!producto && !error && (
        <p className="text-gray-500 text-sm tracking-wide">Cargando...</p>
      )}

      {producto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="w-full aspect-square bg-neutral-950/80 border border-neutral-800/80 rounded-xl flex items-center justify-center overflow-hidden p-10">
            {producto.imagenUrl ? (
              <img
                src={producto.imagenUrl}
                alt={`${producto.marca} ${producto.modelo}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-7xl">⌚</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs tracking-[0.2em] font-bold text-[#D4AF37]/70 uppercase mb-2">
              {producto.categoria}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase">
              {producto.marca}
            </h2>
            <p className="text-lg text-gray-300 tracking-wide mt-1">{producto.modelo}</p>

            {producto.descripcion && (
              <p className="text-gray-400 text-sm leading-relaxed mt-6">{producto.descripcion}</p>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-800/60">
              <span className="text-3xl font-black text-white">
                ${producto.precio.toLocaleString("es-CL")}
              </span>
              <p className="text-gray-500 text-xs mt-2">{producto.stock} en stock</p>
            </div>

            <button
              type="button"
              onClick={handleAgregar}
              disabled={agregando || producto.stock <= 0}
              className="mt-8 bg-[#D4AF37] text-black font-black text-xs px-6 py-4 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {agregando ? "Agregando..." : "Agregar al carrito"}
            </button>
            {agregado && (
              <p className="text-[#D4AF37] text-xs tracking-wide mt-3">Agregado al carrito.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
