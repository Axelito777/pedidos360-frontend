import gatewayClient from "./gatewayClient";

export const crearCarrito = () => gatewayClient.post("/carrito").then((r) => r.data);

export const obtenerCarrito = (id) => gatewayClient.get(`/carrito/${id}`).then((r) => r.data);

export const agregarItem = (carritoId, item) =>
  gatewayClient.post(`/carrito/${carritoId}/items`, item).then((r) => r.data);

export const quitarItem = (carritoId, itemId) =>
  gatewayClient.delete(`/carrito/${carritoId}/items/${itemId}`).then((r) => r.data);

export const confirmarCarrito = (carritoId) =>
  gatewayClient.post(`/carrito/${carritoId}/confirmar`).then((r) => r.data);