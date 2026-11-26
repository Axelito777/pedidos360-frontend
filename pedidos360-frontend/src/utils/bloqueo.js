import { msalInstance } from "../msalInstance";

// Bloqueo antifraude: ms-pago, carrito-service y orders-service responden
// 423 {"error":"USER_BLOCKED","until":"<ISO>"} mientras el usuario esté bloqueado.

export const esBloqueo = (e) => e?.response?.status === 423;

// Fecha de fin del bloqueo que viene en un 423 (null si no viene o no es válida)
export function hastaDelError(e) {
  const until = e?.response?.data?.until;
  const fecha = until ? new Date(until) : null;
  return fecha && !Number.isNaN(fecha.getTime()) ? fecha : null;
}

// Hora local legible, ej. "16:40"
export const formatearHora = (fecha) =>
  fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export const mensajeBloqueo = (hasta) =>
  `Tu cuenta está bloqueada temporalmente por actividad sospechosa${hasta ? ` hasta las ${formatearHora(hasta)}` : ""}.`;

// oid del usuario conectado (en Entra ID, localAccountId es el mismo oid del token)
export function usuarioActualId() {
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  return account?.idTokenClaims?.oid || account?.localAccountId || null;
}
