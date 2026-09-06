import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { loginRequest } from "../msalConfig";

function Login() {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <UnauthenticatedTemplate>
        <button onClick={handleLogin}>Iniciar sesión</button>
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <p>
          Hola, {accounts[0]?.name} ({accounts[0]?.username})
        </p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </AuthenticatedTemplate>
    </div>
  );
}

export default Login;