import gatewayClient from "./gatewayClient";

// POST /payments: 201 aprobado, 402 rechazado, 429 bloqueado por fraude, 400 validación
export const crearPago = (pago) => gatewayClient.post("/payments", pago).then((r) => r.data);

// POST /payments/webpay/init: 201 {paymentId, token, url, buyOrder}; 502 Transbank falló; 503 sin configurar
export const iniciarWebpay = ({ orderId, amount, currency }) =>
  gatewayClient.post("/payments/webpay/init", { orderId, amount, currency }).then((r) => r.data);

// GET /payments/{id}: estado real del pago (status, method, orderId, last4...)
export const obtenerPago = (paymentId) =>
  gatewayClient.get(`/payments/${paymentId}`).then((r) => r.data);

// GET /payments/fraud-status/{userId}: {blocked, until} (ISO en UTC). Solo el dueño o un Admin.
export const obtenerEstadoFraude = (userId) =>
  gatewayClient.get(`/payments/fraud-status/${encodeURIComponent(userId)}`).then((r) => r.data);
