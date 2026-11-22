import { useEffect, useRef, useState } from "react";
import { obtenerPago } from "../api/paymentsApi";
import { obtenerCarrito, confirmarCarrito } from "../api/carritoApi";
import { crearOrden } from "../api/ordersApi";
import { CLAVE_PENDIENTE, claveProcesado, guardarSesion, leerSesion } from "../utils/webpay";

// El backend redirige a #/pago/resultado?paymentId=<id>&status=<ESTADO>.
// Solo se usa el paymentId: el status de la URL NO se usa para decidir (cualquiera puede escribirlo);
// el estado real se consulta a ms-pago con GET /payments/{id}.
function leerPaymentIdDelHash() {
  const query = window.location.hash.split("?")[1] || "";
  const paymentId = new URLSearchParams(query).get("paymentId");
  return /^\d+$/.test(paymentId || "") ? paymentId : null;
}

const mensajeApi = (e) => e.response?.data?.message || e.message;

// Verifica el pago y decide qué mostrar. Fuera del componente: recibe los setters que necesita
async function procesar(setVista, setCartId) {
  const paymentId = leerPaymentIdDelHash();
  if (!paymentId) {
    setVista({ tipo: "desconocido", texto: "No pudimos identificar el pago. Si se realizó un cargo, contáctanos." });
    return;
  }

  // Si este pago ya se procesó (recarga de página), se muestra el mismo resultado sin repetir nada
  const previo = leerSesion(claveProcesado(paymentId));
  if (previo) {
    setVista(
      previo.tipo === "procesando"
        ? {
            tipo: "error",
            texto: `El pago #${paymentId} fue aprobado, pero el proceso de compra se interrumpió. Guarda el ID de pago para rastrearlo. No se reintentará ni se volverá a cobrar automáticamente.`,
          }
        : previo
    );
    return;
  }

  let pago;
  try {
    pago = await obtenerPago(paymentId);
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) {
      setVista({ tipo: "desconocido", texto: `No encontramos el pago #${paymentId}.` });
    } else if (!e.response || status === 401) {
      // Sin respuesta del backend: típicamente MSAL no pudo entregar el token
      setVista({
        tipo: "error",
        texto: `No pudimos recuperar tu sesión para verificar el pago #${paymentId}. Inicia sesión nuevamente y vuelve a esta página.`,
      });
    } else {
      setVista({ tipo: "error", texto: `No pudimos verificar el pago #${paymentId}: ${mensajeApi(e)}` });
    }
    return;
  }

  if (pago.status === "APPROVED") {
    await finalizarCompra(pago, setVista, setCartId);
    return;
  }

  // Estados finales sin cobro: el carrito queda intacto para intentarlo de nuevo
  if (pago.status !== "PENDING") sessionStorage.removeItem(CLAVE_PENDIENTE);
  if (pago.status === "CANCELLED") {
    setVista({ tipo: "cancelado", texto: "Anulaste el pago en Webpay o se agotó el tiempo. No se realizó ningún cargo." });
  } else if (pago.status === "PENDING") {
    setVista({ tipo: "pendiente", texto: `El pago #${pago.id} aún no se completa en Webpay.` });
  } else {
    setVista({ tipo: "rechazado", texto: "Webpay rechazó el pago. No se realizó ningún cargo; puedes intentar con otra tarjeta." });
  }
}

// Pago aprobado: confirmar carrito -> crear orden, igual que el flujo simulado (Cart.jsx).
// Sin reintentos automáticos: si algo falla se muestra el paymentId y no se deja volver a pagar.
async function finalizarCompra(pago, setVista, setCartId) {
  const clave = claveProcesado(pago.id);
  // El marcador se escribe ANTES de tocar el carrito: si se recarga a mitad de camino, no se repite
  guardarSesion(clave, { tipo: "procesando" });

  // cartId guardado al salir hacia Webpay; si no está (otra pestaña), el orderId del pago es el cartId
  const pendiente = leerSesion(CLAVE_PENDIENTE);
  const cartId =
    pendiente && String(pendiente.paymentId) === String(pago.id) && pendiente.cartId
      ? String(pendiente.cartId)
      : String(pago.orderId);

  const terminar = (resultado) => {
    guardarSesion(clave, resultado);
    sessionStorage.removeItem(CLAVE_PENDIENTE);
    // Decisión: el carrito pagado se desvincula de la tienda para que no se pueda volver a pagar
    if (localStorage.getItem("cartId") === cartId) {
      localStorage.removeItem("cartId");
      setCartId(null);
    }
    setVista(resultado);
  };

  const errorPosterior = (detalle) =>
    terminar({
      tipo: "error",
      texto: `El pago fue aprobado (ID de pago #${pago.id}), pero ${detalle}. Guarda el ID de pago para rastrearlo. No se reintentará ni se volverá a cobrar automáticamente.`,
    });

  setVista({ tipo: "cargando", texto: "Pago aprobado. Confirmando tu compra..." });

  let carrito;
  try {
    carrito = await obtenerCarrito(cartId);
  } catch (e) {
    errorPosterior(`no se pudo leer el carrito #${cartId}: ${mensajeApi(e)}`);
    return;
  }
  // El carrito pudo cambiar en otra pestaña mientras se pagaba: no se crea una orden por otro monto
  if (Number(carrito.total) !== Number(pago.amount)) {
    errorPosterior(`el total del carrito #${cartId} ya no coincide con el monto pagado`);
    return;
  }

  const itemsParaOrden = carrito.items.map((item) => ({
    productId: item.relojId,
    productName: `${item.marca} ${item.modelo}`,
    quantity: item.cantidad,
    unitPrice: item.precioUnitario,
  }));

  try {
    await confirmarCarrito(cartId);
  } catch (e) {
    errorPosterior(`no se pudo confirmar el carrito #${cartId}: ${mensajeApi(e)}`);
    return;
  }

  try {
    const orden = await crearOrden(itemsParaOrden);
    terminar({
      tipo: "ok",
      texto: `Compra confirmada. Orden #${orden.id} creada. Pago #${pago.id} aprobado por Webpay${
        pago.last4 ? ` con la tarjeta terminada en ${pago.last4}` : ""
      }.`,
    });
  } catch (e) {
    errorPosterior(`el carrito #${cartId} quedó confirmado y falló el registro del pedido: ${mensajeApi(e)}`);
  }
}

function WebpayResult({ setCartId, onVolver }) {
  // vista = { tipo: "cargando" | "ok" | "error" | "rechazado" | "cancelado" | "pendiente" | "desconocido", texto }
  const [vista, setVista] = useState({ tipo: "cargando", texto: "Verificando tu pago con Webpay..." });
  // React.StrictMode ejecuta los efectos dos veces en desarrollo: esto evita procesar dos veces
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    procesar(setVista, setCartId);
  }, [setCartId]);

  const titulos = {
    cargando: "Procesando",
    ok: "Pago aprobado",
    error: "Atención",
    rechazado: "Pago rechazado",
    cancelado: "Pago anulado",
    pendiente: "Pago pendiente",
    desconocido: "Pago no encontrado",
  };

  const colorCaja =
    vista.tipo === "ok"
      ? "border-[#D4AF37]/50 text-[#D4AF37]"
      : vista.tipo === "cargando" || vista.tipo === "pendiente"
        ? "border-neutral-700 text-gray-300"
        : "border-red-500/50 text-red-400";

  // Con rechazo o anulación el carrito sigue intacto: se vuelve a él para reintentar
  const textoBoton =
    vista.tipo === "rechazado" || vista.tipo === "cancelado" || vista.tipo === "pendiente"
      ? "Volver al carrito"
      : vista.tipo === "ok"
        ? "Seguir comprando"
        : "Volver a la tienda";

  return (
    <section className="max-w-xl mx-auto mt-6 bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 sm:p-8">
      <p className="text-[10px] tracking-[0.2em] font-bold text-[#D4AF37]/70 uppercase mb-2">Webpay</p>
      <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase">{titulos[vista.tipo]}</h2>

      <div className={`rounded-lg border p-4 text-sm ${colorCaja}`}>{vista.texto}</div>

      {vista.tipo !== "cargando" && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onVolver}
            className="bg-[#D4AF37] text-black font-black text-xs px-6 py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors"
          >
            {textoBoton}
          </button>
        </div>
      )}
    </section>
  );
}

export default WebpayResult;
