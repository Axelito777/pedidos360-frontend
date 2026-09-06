import { useEffect, useState } from "react";
import { obtenerCarrito, quitarItem, confirmarCarrito } from "../api/carritoApi";

function Cart({ cartId, setCartId, cartVersion }) {
  const [carrito, setCarrito] = useState(null);
  const [error, setError] = useState(null);

  const cargar = async () => {
    if (!cartId) return;
    setError(null);
    try {
      setCarrito(await obtenerCarrito(cartId));
    } catch (e) {
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
    await confirmarCarrito(cartId);
    localStorage.removeItem("cartId");
    setCartId(null);
    setCarrito(null);
    alert("Compra confirmada");
  };

  if (!cartId) {
    return (
      <div>
        <h2>Carrito</h2>
        <p>Aún no tienes carrito (agrega un producto).</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Carrito #{cartId}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {carrito && (
        <>
          <ul>
            {carrito.items.map((item) => (
              <li key={item.id}>
                {item.marca} {item.modelo} x{item.cantidad} — ${item.precioUnitario}
                <button style={{ marginLeft: 10 }} onClick={() => handleQuitar(item.id)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p>
            <strong>Total: ${carrito.total}</strong>
          </p>
          <button onClick={handleConfirmar} disabled={carrito.items.length === 0}>
            Confirmar compra
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;