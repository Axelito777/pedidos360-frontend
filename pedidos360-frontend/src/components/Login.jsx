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
    <div className="mb-10 flex items-center justify-between flex-wrap gap-3">
      <UnauthenticatedTemplate>
        <button
          onClick={handleLogin}
          className="bg-[#D4AF37] text-black text-xs font-black px-6 py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors"
        >
          Iniciar sesión
        </button>
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <p className="text-gray-400 text-sm">
          Hola, <span className="text-white font-semibold">{accounts[0]?.name}</span>{" "}
          <span className="text-gray-600">({accounts[0]?.username})</span>
        </p>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Cerrar sesión
        </button>
      </AuthenticatedTemplate>
    </div>
  );
}

export default Login;