import { useState } from "react";
import { crearPago, iniciarWebpay } from "../api/paymentsApi";
import { CLAVE_PENDIENTE, guardarSesion, redirigirAWebpay } from "../utils/webpay";

// MM/YY válido y no vencido (vale todo el mes de vencimiento, igual que ms-pago)
function vencimientoValido(valor) {
  const m = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  return new Date(anio, mes, 1) > new Date(); // primer día del mes siguiente
}

// Mismas reglas que el DTO PaymentRequest
function validar({ numero, titular, vencimiento, cvv }) {
  const errores = {};
  if (!/^\d{13,19}$/.test(numero)) errores.numero = "Debe tener entre 13 y 19 dígitos.";
  if (!titular.trim()) errores.titular = "Ingresa el nombre del titular.";
  else if (titular.trim().length > 100) errores.titular = "Máximo 100 caracteres.";
  if (!vencimientoValido(vencimiento)) errores.vencimiento = "Usa MM/YY con una fecha no vencida.";
  if (!/^\d{3,4}$/.test(cvv)) errores.cvv = "3 o 4 dígitos.";
  return errores;
}

// Traduce la respuesta de ms-pago. Nunca se loguea el error: axios guarda el body (con la tarjeta)
function mensajeError(e) {
  const status = e.response?.status;
  if (status === 402) return "Pago rechazado. Revisa los datos o usa otra tarjeta.";
  if (status === 429) return "Pago bloqueado por posible fraude: demasiados intentos, espera unos segundos.";
  if (status === 400) {
    // Los mensajes de validación del backend no repiten el valor recibido
    const detalles = e.response.data?.details;
    return "Datos inválidos: " + (detalles?.length ? detalles.join(" ") : e.response.data?.message || "revisa el formulario.");
  }
  if (status === 401 || status === 403) return "No tienes permiso para pagar. Vuelve a iniciar sesión.";
  return "No se pudo procesar el pago. Intenta nuevamente.";
}

// Errores al iniciar Webpay (POST /payments/webpay/init)
function mensajeErrorWebpay(e) {
  const status = e.response?.status;
  if (status === 502) return "Webpay no está disponible en este momento. Intenta nuevamente en unos minutos.";
  if (status === 503) return "El pago con Webpay no está habilitado por ahora. Usa otro método de pago.";
  if (status === 400) {
    const detalles = e.response.data?.details;
    return "Datos inválidos: " + (detalles?.length ? detalles.join(" ") : e.response.data?.message || "revisa el monto.");
  }
  if (status === 401 || status === 403) return "No tienes permiso para pagar. Vuelve a iniciar sesión.";
  return "No se pudo iniciar el pago con Webpay. Intenta nuevamente.";
}

const METODOS = [
  { id: "tarjeta", texto: "Tarjeta (simulado)" },
  { id: "webpay", texto: "Webpay" },
];

const claseInput =
  "w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2.5 text-white text-sm tracking-widest focus:outline-none focus:border-[#D4AF37]";
const claseLabel = "text-[10px] tracking-[0.2em] font-bold text-[#D4AF37]/70 uppercase block mb-1";

function PaymentForm({ cartId, monto, onAprobado, onCancelar }) {
  // Número y CVV viven solo en este estado local: no se guardan en storage ni se loguean
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  // "tarjeta" = flujo simulado de siempre; "webpay" = el usuario paga en el sitio de Transbank
  const [metodo, setMetodo] = useState("tarjeta");

  // Webpay: crea el pago en ms-pago y manda al usuario a Transbank (no se piden datos de tarjeta)
  const pagarConWebpay = async () => {
    setEnviando(true);
    setMensaje(null);
    try {
      const { paymentId, token, url } = await iniciarWebpay({
        orderId: Number(cartId), // igual que el simulado: la referencia es el cartId
        amount: monto,
        currency: "CLP",
      });
      if (!token || !/^https:\/\//.test(url || "")) {
        throw new Error("Respuesta de Webpay inválida");
      }
      // Al volver de Transbank, WebpayResult usa estos datos para confirmar el carrito y crear la orden
      guardarSesion(CLAVE_PENDIENTE, { cartId: String(cartId), paymentId });
      redirigirAWebpay(url, token);
      // No se desbloquea el botón: el navegador ya está saliendo hacia Webpay
    } catch (err) {
      setMensaje(mensajeErrorWebpay(err));
      setEnviando(false);
    }
  };

  // Inserta la "/" automáticamente: 1228 -> 12/28
  const handleVencimiento = (valor) => {
    const d = valor.replace(/\D/g, "").slice(0, 4);
    setVencimiento(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (metodo === "webpay") {
      pagarConWebpay();
      return;
    }
    const errs = validar({ numero, titular, vencimiento, cvv });
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;

    setEnviando(true);
    setMensaje(null);
    try {
      const pago = await crearPago({
        orderId: Number(cartId), // referencia de compra: el cartId (la orden aún no existe)
        cardNumber: numero,
        cardHolder: titular.trim(),
        expiry: vencimiento,
        cvv,
        amount: monto,
        currency: "CLP",
      });
      onAprobado(pago);
    } catch (err) {
      setMensaje(mensajeError(err));
    } finally {
      // Tras cada envío se borran número y CVV, sea cual sea el resultado
      setNumero("");
      setCvv("");
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 sm:p-6"
    >
      <h3 className="text-sm font-black text-white tracking-widest uppercase mb-5">
        Datos de pago{" "}
        <span className="text-[#D4AF37]">${monto.toLocaleString("es-CL")}</span>
      </h3>

      {/* Selector de método de pago */}
      <fieldset className="mb-5" disabled={enviando}>
        <legend className={claseLabel}>Método de pago</legend>
        <div className="grid grid-cols-2 gap-3">
          {METODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMetodo(m.id);
                setMensaje(null);
              }}
              aria-pressed={metodo === m.id}
              className={`rounded-md border px-3 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-40 ${
                metodo === m.id
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-neutral-700 text-gray-400 hover:text-white"
              }`}
            >
              {m.texto}
            </button>
          ))}
        </div>
      </fieldset>

      {metodo === "webpay" && (
        <p className="text-gray-400 text-sm leading-relaxed">
          Serás redirigido al sitio seguro de <span className="text-white font-bold">Webpay</span> para
          ingresar los datos de tu tarjeta. Tus datos no pasan por Pedidos360.
        </p>
      )}

      {metodo === "tarjeta" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="pago-numero" className={claseLabel}>Número de tarjeta</label>
          <input
            id="pago-numero"
            inputMode="numeric"
            autoComplete="cc-number"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 19))}
            className={claseInput}
          />
          {errores.numero && <p className="text-red-400 text-xs mt-1">{errores.numero}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pago-titular" className={claseLabel}>Titular</label>
          <input
            id="pago-titular"
            autoComplete="cc-name"
            value={titular}
            maxLength={100}
            onChange={(e) => setTitular(e.target.value)}
            className={claseInput}
          />
          {errores.titular && <p className="text-red-400 text-xs mt-1">{errores.titular}</p>}
        </div>

        <div>
          <label htmlFor="pago-vencimiento" className={claseLabel}>Vencimiento (MM/YY)</label>
          <input
            id="pago-vencimiento"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={vencimiento}
            onChange={(e) => handleVencimiento(e.target.value)}
            className={claseInput}
          />
          {errores.vencimiento && <p className="text-red-400 text-xs mt-1">{errores.vencimiento}</p>}
        </div>

        <div>
          <label htmlFor="pago-cvv" className={claseLabel}>CVV</label>
          <input
            id="pago-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={claseInput}
          />
          {errores.cvv && <p className="text-red-400 text-xs mt-1">{errores.cvv}</p>}
        </div>
      </div>
      )}

      {mensaje && (
        <p className="mt-5 text-sm text-red-400 border border-red-500/40 rounded-md p-3">{mensaje}</p>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white px-4 py-3 transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="bg-[#D4AF37] text-black font-black text-xs px-6 py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {metodo === "webpay"
            ? enviando ? "Redirigiendo a Webpay..." : "Pagar con Webpay"
            : enviando ? "Procesando pago..." : "Pagar"}
        </button>
      </div>
    </form>
  );
}

export default PaymentForm;
