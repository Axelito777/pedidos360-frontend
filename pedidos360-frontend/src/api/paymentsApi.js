import gatewayClient from "./gatewayClient";

// POST /payments: 201 aprobado, 402 rechazado, 429 bloqueado por fraude, 400 validación
export const crearPago = (pago) => gatewayClient.post("/payments", pago).then((r) => r.data);
