import { useEffect, useState } from "react";
import { getProductos } from "../api/productosApi";
import { agregarAlCarrito } from "../utils/agregarAlCarrito";

function ProductList({ cartId, setCartId, onCartChange, catalogVersion, onVerDetalle }) {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProductos().then(setProductos).catch((e) => setError(e.message));
  }, [catalogVersion]);

  const handleAgregar = async (producto) => {
    try {
      await agregarAlCarrito(producto, cartId, setCartId);
      onCartChange();
    } catch (e) {
      alert("Error al agregar: " + e.message);
    }
  };

  return (
    <div id="catalogo" className="mb-16">
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 tracking-widest uppercase">
        Catálogo
      </h2>
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map((p) => (
          <div
            key={p.id}
            className="group bg-neutral-900/40 border border-neutral-800/80 rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#D4AF37]/40 transition-all duration-300"
          >
            {/* Clic en la imagen o el nombre abre el detalle */}
            <button
              type="button"
              onClick={() => onVerDetalle(p.id)}
              className="relative w-full aspect-square bg-neutral-950/80 flex items-center justify-center overflow-hidden p-6 cursor-pointer"
            >
              {p.imagenUrl ? (
                <img
                  src={p.imagenUrl}
                  alt={`${p.marca} ${p.modelo}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-4xl">⌚</span>
              )}
            </button>

            <div className="p-5 flex flex-col flex-grow justify-between">
              <div>
                <span className="text-[10px] tracking-[0.2em] font-bold text-[#D4AF37]/70 uppercase block mb-1">
                  {p.categoria}
                </span>
                <h3 className="text-base font-bold text-white tracking-wide">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(p.id)}
                    className="text-left cursor-pointer hover:text-[#D4AF37] transition-colors"
                  >
                    {p.marca} {p.modelo}
                  </button>
                </h3>
                <p className="text-gray-500 text-xs mt-1">{p.stock} en stock</p>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                <span className="text-lg font-black text-white">
                  ${p.precio.toLocaleString("es-CL")}
                </span>
                <button
                  onClick={() => handleAgregar(p)}
                  className="bg-neutral-800 text-white text-xs font-bold px-4 py-2.5 rounded-md border border-neutral-700 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all duration-300 active:scale-95"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
