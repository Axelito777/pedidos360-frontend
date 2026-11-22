export const msalConfig = {
  auth: {
    clientId: "42b7d432-638e-4b04-9368-9616b322e672",
    authority: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};


export const loginRequest = {
  scopes: [
    "api://42b7d432-638e-4b04-9368-9616b322e672/productos.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/productos.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/carrito.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/carrito.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/orders.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/orders.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/notifications.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/reportes.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/rabbitmq.admin",
    "api://42b7d432-638e-4b04-9368-9616b322e672/payments.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/payments.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/analytics.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/kafka.admin",
  ],
};