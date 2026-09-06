import axios from "axios";
import { msalInstance } from "../msalInstance";
import { loginRequest } from "../msalConfig";

const gatewayClient = axios.create({
  baseURL: "https://g3sucv184a.execute-api.us-east-1.amazonaws.com",
});

// Equivalente al MsalInterceptor de Angular: adjunta el Bearer token
// automáticamente en cada llamada al Gateway, nunca a los microservicios directo.
gatewayClient.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (!account) {
    throw new Error("No hay sesión activa. Inicia sesión primero.");
  }
  const response = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account,
  });
  config.headers.Authorization = `Bearer ${response.accessToken}`;
  return config;
});

export default gatewayClient;