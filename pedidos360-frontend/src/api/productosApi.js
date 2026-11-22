import gatewayClient from "./gatewayClient";

export const getProductos = () => gatewayClient.get("/productos").then((r) => r.data);

export const crearProducto = (producto) =>
  gatewayClient.post("/productos", producto).then((r) => r.data);

// Detalle de un reloj: el backend publica PRODUCT_VIEWED al recibirlo con token
export const getProductoPorId = (id) => gatewayClient.get(`/productos/${id}`).then((r) => r.data);
