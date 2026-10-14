import { useEffect, useState } from "react";
import { obtenerCarrito, quitarItem, confirmarCarrito } from "../api/carritoApi";
import { crearOrden } from "../api/ordersApi";

function Cart({ cartId, setCartId, cartVersion }) {
  const [carrito, setCarrito] = useState(null);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = async () => {
    if (!cartId) return;
    setError(null);
    try {
      setCarrito(await obtenerCarrito(cartId));
    } catch (e) {
      if (e.response?.status === 404) {
        localStorage.removeItem("cartId");
        setCartId(null);
        setCarrito(null);
        return;
      }
      setError(e.message);
    }
  };

  useEffect(() => {
    cargar();
  }, [cartId, cartVersion]);

  const handleQuitar = async (itemId) => {
    await quitarItem(cartId, itemId);
    cargar();
  };

  const handleConfirmar = async () => {
    if (confirmando) return;
    setConfirmando(true);

    const itemsParaOrden = carrito.items.map((item) => ({
      productId: item.relojId,
      productName: `${item.marca} ${item.modelo}`,
      quantity: item.cantidad,
      unitPrice: item.precioUnitario,
    }));

    try {
      await confirmarCarrito(cartId);
    } catch (e) {
      setConfirmando(false);
      alert("Error al confirmar el carrito: " + (e.response?.data?.message || e.message));
      return;
    }

    try {
      await crearOrden(itemsParaOrden);
      alert("Compra confirmada");
    } catch (e) {
      alert("Carrito confirmado, pero falló el registro del pedido: " + e.message);
    }

    localStorage.removeItem("cartId");
    setCartId(null);
    setCarrito(null);
    setConfirmando(false);
  };

  if (!cartId) {
    return (
      <div className="border-t border-neutral-800 pt-10">
        <h2 className="text-2xl font-black text-white mb-3 tracking-widest uppercase">Carrito</h2>
        <p className="text-gray-500 text-sm">Aún no tienes carrito (agrega un producto).</p>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-800 pt-10">
      <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase">
        Carrito <span className="text-[#D4AF37]">#{cartId}</span>
      </h2>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {carrito && (
        <>
          <div className="space-y-3 mb-6">
            {carrito.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 rounded-lg p-4"
              >
                <div>
                  <p className="text-white text-sm font-bold">
                    {item.marca} {item.modelo} <span className="text-gray-500">x{item.cantidad}</span>
                  </p>
                  <p className="text-[#D4AF37] text-sm">${item.precioUnitario.toLocaleString("es-CL")}</p>
                </div>
                <button
                  onClick={() => handleQuitar(item.id)}
                  className="text-neutral-500 hover:text-red-500 text-xl transition-colors"
                  title="Quitar"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
            <span className="text-white text-lg font-black">
              TOTAL: <span className="text-[#D4AF37]">${carrito.total.toLocaleString("es-CL")}</span>
            </span>
            <button
              onClick={handleConfirmar}
              disabled={carrito.items.length === 0 || confirmando}
              className="bg-[#D4AF37] text-black font-black text-xs px-6 py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {confirmando ? "Procesando..." : "Confirmar compra"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;