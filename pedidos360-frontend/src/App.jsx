import { useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import Login from "./components/Login";
import HeroCarousel from "./components/HeroCarousel";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
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
  // Id del reloj cuyo detalle se está viendo (null = catálogo)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const verDetalle = (id) => {
    setProductoSeleccionado(id);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-neutral-800 px-6 py-5">
        <h1 className="text-2xl font-black tracking-widest uppercase text-white">
          PEDIDOS<span className="text-[#D4AF37]">360</span>
        </h1>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-24">
        <Login />

        <UnauthenticatedTemplate>
          <p className="text-gray-400 text-center mt-16 tracking-wide">
            Inicia sesión para ver el catálogo.
          </p>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
          {/* Sin router: si hay un producto seleccionado se muestra su detalle en vez del catálogo */}
          {productoSeleccionado ? (
            <ProductDetail
              key={productoSeleccionado} // al cambiar de reloj se reinicia su estado
              productoId={productoSeleccionado}
              cartId={cartId}
              setCartId={setCartId}
              onCartChange={() => setCartVersion((v) => v + 1)}
              onVolver={() => setProductoSeleccionado(null)}
            />
          ) : (
            <>
              {isAdmin && (
                <AdminPanel onProductCreated={() => setCatalogVersion((v) => v + 1)} />
              )}
              <ProductList
                cartId={cartId}
                setCartId={setCartId}
                onCartChange={() => setCartVersion((v) => v + 1)}
                catalogVersion={catalogVersion}
                onVerDetalle={verDetalle}
              />
            </>
          )}
          <Cart cartId={cartId} setCartId={setCartId} cartVersion={cartVersion} />
        </AuthenticatedTemplate>
      </main>
    </div>
  );
}

export default App;