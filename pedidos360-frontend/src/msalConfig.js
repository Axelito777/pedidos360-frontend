export const msalConfig = {
  auth: {
    clientId: "42b7d432-638e-4b04-9368-9616b322e672",
    authority: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Nota: pedimos los 4 scopes siempre porque por ahora la única cuenta
// con la que probamos (axel) tiene el rol Admin. Si más adelante quieres
// demostrar el contraste con un usuario sin permisos, avísame y separamos
// esta lógica según el rol detectado en el idToken.
export const loginRequest = {
  scopes: [
    "api://42b7d432-638e-4b04-9368-9616b322e672/productos.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/productos.write",
    "api://42b7d432-638e-4b04-9368-9616b322e672/carrito.read",
    "api://42b7d432-638e-4b04-9368-9616b322e672/carrito.write",
  ],
};