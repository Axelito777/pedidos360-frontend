import { crearCarrito, agregarItem } from "../api/carritoApi";

// Crea un carrito nuevo y recuerda solo su id
const nuevoCarrito = async (setCartId) => {
  const carrito = await crearCarrito();
  localStorage.setItem("cartId", carrito.id);
  setCartId(carrito.id);
  return carrito.id;
};

// Agrega un reloj al carrito; si el carrito ya no existe (404) crea uno nuevo y reintenta
export async function agregarAlCarrito(producto, cartId, setCartId) {
  let id = cartId || (await nuevoCarrito(setCartId));
  const payload = {
    relojId: producto.id,
    marca: producto.marca,
    modelo: producto.modelo,
    categoria: producto.categoria,
    precioUnitario: producto.precio,
    cantidad: 1,
  };
  try {
    await agregarItem(id, payload);
  } catch (e) {
    if (e.response?.status !== 404) throw e;
    id = await nuevoCarrito(setCartId);
    await agregarItem(id, payload);
  }
}
