import { useEffect, useState } from "react";
import { obtenerCarrito, quitarItem, confirmarCarrito } from "../api/carritoApi";
import { crearOrden } from "../api/ordersApi";
import PaymentForm from "./PaymentForm";

function Cart({ cartId, setCartId, cartVersion }) {
  const [carrito, setCarrito] = useState(null);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  // Resultado final de la compra (éxito, o error con el paymentId para rastrearlo)
  const [aviso, setAviso] = useState(null);
  // Carrito ya pagado cuya confirmación falló: no se deja pagar de nuevo (evita doble cobro)
  const [carritoPagadoId, setCarritoPagadoId] = useState(null);

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

  const limpiarCarrito = () => {
    localStorage.removeItem("cartId");
    setCartId(null);
    setCarrito(null);
  };

  // Paso 1: abrir el formulario de pago (la orden se crea solo si el pago se aprueba)
  const handleConfirmar = () => {
    setAviso(null);
    setMostrarPago(true);
  };

  // Paso 2: pago aprobado (201) -> confirmar carrito -> crear orden (esta descuenta stock).
  // Sin reintentos automáticos: si algo falla se muestra el paymentId.
  const handlePagoAprobado = async (pago) => {
    setMostrarPago(false);
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
      setCarritoPagadoId(cartId);
      setAviso({
        tipo: "error",
        texto: `El pago fue aprobado (ID de pago #${pago.id}), pero no se pudo confirmar el carrito #${cartId}: ${e.response?.data?.message || e.message}. Guarda el ID de pago para rastrearlo. No se reintentará ni se volverá a cobrar automáticamente.`,
      });
      setConfirmando(false);
      return;
    }

    try {
      await crearOrden(itemsParaOrden);
      setAviso({
        tipo: "ok",
        texto: `Compra confirmada. Pago #${pago.id} aprobado con la tarjeta terminada en ${pago.last4}.`,
      });
    } catch (e) {
      setAviso({
        tipo: "error",
        texto: `El pago fue aprobado (ID de pago #${pago.id}) y el carrito #${cartId} quedó confirmado, pero falló el registro del pedido: ${e.response?.data?.message || e.message}. Guarda el ID de pago para rastrearlo. No se reintentará automáticamente.`,
      });
    }

    limpiarCarrito();
    setConfirmando(false);
  };

  const avisoUI = aviso && (
    <div
      className={`mb-6 rounded-lg border p-4 text-sm ${
        aviso.tipo === "ok" ? "border-[#D4AF37]/50 text-[#D4AF37]" : "border-red-500/50 text-red-400"
      }`}
    >
      {aviso.texto}
    </div>
  );

  if (!cartId) {
    return (
      <div className="border-t border-neutral-800 pt-10">
        <h2 className="text-2xl font-black text-white mb-3 tracking-widest uppercase">Carrito</h2>
        {avisoUI}
        <p className="text-gray-500 text-sm">Aún no tienes carrito (agrega un producto).</p>
      </div>
    );
  }

  const yaPagado = carritoPagadoId === cartId;

  return (
    <div className="border-t border-neutral-800 pt-10">
      <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase">
        Carrito <span className="text-[#D4AF37]">#{cartId}</span>
      </h2>
      {avisoUI}
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
                  disabled={mostrarPago || confirmando}
                  className="text-neutral-500 hover:text-red-500 text-xl transition-colors disabled:opacity-40"
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
            {!mostrarPago && (
              <button
                onClick={handleConfirmar}
                disabled={carrito.items.length === 0 || confirmando || yaPagado}
                className="bg-[#D4AF37] text-black font-black text-xs px-6 py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {confirmando ? "Procesando..." : "Confirmar compra"}
              </button>
            )}
          </div>

          {mostrarPago && (
            <PaymentForm
              cartId={cartId}
              monto={carrito.total}
              onAprobado={handlePagoAprobado}
              onCancelar={() => setMostrarPago(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Cart;
