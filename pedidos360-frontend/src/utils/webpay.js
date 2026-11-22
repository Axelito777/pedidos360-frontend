// Utilidades de Webpay compartidas por PaymentForm (ida) y WebpayResult (vuelta)

// sessionStorage: {cartId, paymentId} del pago que se fue a Webpay
export const CLAVE_PENDIENTE = "pedidos360-webpay-pendiente";

// sessionStorage: marcador por pago para no crear dos órdenes si se recarga la página
export const claveProcesado = (paymentId) => `pedidos360-webpay-procesado-${paymentId}`;

// Lee un JSON de sessionStorage sin romper la pantalla si no existe o está corrupto
export function leerSesion(clave) {
  try {
    const valor = sessionStorage.getItem(clave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(clave, valor) {
  sessionStorage.setItem(clave, JSON.stringify(valor));
}

// Webpay exige que el navegador llegue a su url con un formulario POST que lleve token_ws.
// Se arma un <form> oculto y se envía: el usuario sale de nuestra página hacia Transbank.
export function redirigirAWebpay(url, token) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
