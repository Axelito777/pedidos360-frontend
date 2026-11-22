import { useEffect, useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import Login from "./components/Login";
import HeroCarousel from "./components/HeroCarousel";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";
import WebpayResult from "./components/WebpayResult";

// Única ruta por hash: a ella redirige ms-pago al volver de Webpay (#/pago/resultado?paymentId=..&status=..)
const RUTA_RESULTADO_WEBPAY = "#/pago/resultado";

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

  // Ruta por hash mínima, sin librería: se lee window.location.hash y se escucha su cambio
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const alCambiar = () => setHash(window.location.hash);
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  const enResultadoWebpay = hash.startsWith(RUTA_RESULTADO_WEBPAY);

  // Sale de la pantalla de resultado: quita el hash (replaceState, para que "atrás" no vuelva a ella)
  const salirDelResultado = () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setHash("");
    setCartVersion((v) => v + 1);
  };

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
          {/* Al volver de Webpay se muestra solo el resultado (sin catálogo ni carrito: no se puede volver a pagar) */}
          {enResultadoWebpay ? (
            <WebpayResult setCartId={setCartId} onVolver={salirDelResultado} />
          ) : (
          <>
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
          </>
          )}
        </AuthenticatedTemplate>
      </main>
    </div>
  );
}

export default App;