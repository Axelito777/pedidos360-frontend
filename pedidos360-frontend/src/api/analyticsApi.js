import gatewayClient from "./gatewayClient";

// GET /analytics/recommendations/{userId}: hasta 5 relojes con nombre, precio, imagenUrl y motivo.
// Solo las propias (userId = oid del token) o de cualquiera si es Admin.
export const obtenerRecomendaciones = (userId) =>
  gatewayClient.get(`/analytics/recommendations/${encodeURIComponent(userId)}`).then((r) => r.data);
