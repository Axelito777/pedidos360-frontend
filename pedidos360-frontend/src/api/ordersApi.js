import gatewayClient from "./gatewayClient";

export const crearOrden = (items) =>
  gatewayClient.post("/orders", { items }).then((r) => r.data);