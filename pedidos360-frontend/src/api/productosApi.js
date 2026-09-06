import gatewayClient from "./gatewayClient";

export const getProductos = () => gatewayClient.get("/productos").then((r) => r.data);

export const crearProducto = (producto) =>
  gatewayClient.post("/productos", producto).then((r) => r.data);