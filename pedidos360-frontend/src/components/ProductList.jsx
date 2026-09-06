import { useEffect, useState } from "react";
import { getProductos } from "../api/productosApi";
import { crearCarrito, agregarItem } from "../api/carritoApi";

function ProductList({ cartId, setCartId, onCartChange, catalogVersion }) {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProductos().then(setProductos).catch((e) => setError(e.message));
  }, [catalogVersion]);

  const asegurarCarrito = async () => {
    if (cartId) return cartId;
    const carrito = await crearCarrito();
    localStorage.setItem("cartId", carrito.id);
    setCartId(carrito.id);
    return carrito.id;
  };

  const handleAgregar = async (producto) => {
    try {
      let id = await asegurarCarrito();
      const payload = {
        relojId: producto.id,
        marca: producto.marca,
        modelo: producto.modelo,
        precioUnitario: producto.precio,
        cantidad: 1,
      };
      try {
        await agregarItem(id, payload);
      } catch (e) {
        if (e.response?.status === 404) {
          // El carrito guardado ya no existe (ej. el backend se reinició, H2 en memoria se vació)
          const carritoNuevo = await crearCarrito();
          localStorage.setItem("cartId", carritoNuevo.id);
          setCartId(carritoNuevo.id);
          id = carritoNuevo.id;
          await agregarItem(id, payload);
        } else {
          throw e;
        }
      }
      onCartChange();
      alert(`${producto.marca} ${producto.modelo} agregado al carrito`);
    } catch (e) {
      alert("Error al agregar: " + e.message);
    }
  };

  return (
    <div>
      <h2>Catálogo</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {productos.map((p) => (
          <li key={p.id} style={{ marginBottom: 10 }}>
            <strong>{p.marca} {p.modelo}</strong> — ${p.precio} ({p.stock} en stock)
            <button style={{ marginLeft: 10 }} onClick={() => handleAgregar(p)}>
              Agregar al carrito
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;