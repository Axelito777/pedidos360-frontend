import { useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import Login from "./components/Login";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";

function App() {
  const { accounts } = useMsal();
  const account = accounts[0];
  const roles = account?.idTokenClaims?.roles || [];
  const isAdmin = roles.includes("Admin");

  const [cartId, setCartId] = useState(() => localStorage.getItem("cartId") || null);
  const [cartVersion, setCartVersion] = useState(0);
  const [catalogVersion, setCatalogVersion] = useState(0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Pedidos360</h1>
      <Login />

      <UnauthenticatedTemplate>
        <p>Inicia sesión para ver el catálogo.</p>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        {isAdmin && (
          <AdminPanel onProductCreated={() => setCatalogVersion((v) => v + 1)} />
        )}
        <ProductList
          cartId={cartId}
          setCartId={setCartId}
          onCartChange={() => setCartVersion((v) => v + 1)}
          catalogVersion={catalogVersion}
        />
        <Cart cartId={cartId} setCartId={setCartId} cartVersion={cartVersion} />
      </AuthenticatedTemplate>
    </div>
  );
}

export default App;