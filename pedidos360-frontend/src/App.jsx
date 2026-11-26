import { useEffect, useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import Login from "./components/Login";
import HeroCarousel from "./components/HeroCarousel";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";
import WebpayResult from "./components/WebpayResult";
import Recomendados from "./components/Recomendados";

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
  // Sube con cada interacción que genera un evento en Kafka (ver detalle, agregar, comprar):
  // "Recomendados para ti" se vuelve a pedir cuando cambia
  const [interaccionVersion, setInteraccionVersion] = useState(0);

  // Agregar al carrito: refresca el carrito y las recomendaciones
  const alCambiarCarrito = () => {
    setCartVersion((v) => v + 1);
    setInteraccionVersion((v) => v + 1);
  };

  // Al terminar una compra el carrito se vacía (cartId -> null): lo comprado sale de las recomendaciones
  const cambiarCartId = (id) => {
    setCartId(id);
    if (id === null) setInteraccionVersion((v) => v + 1);
  };

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
    setInteraccionVersion((v) => v + 1); // abrir el detalle publica PRODUCT_VIEWED
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
            <WebpayResult setCartId={cambiarCartId} onVolver={salirDelResultado} />
          ) : (
          <>
          {/* Sin router: si hay un producto seleccionado se muestra su detalle en vez del catálogo */}
          {productoSeleccionado ? (
            <>
            <ProductDetail
              key={productoSeleccionado} // al cambiar de reloj se reinicia su estado
              productoId={productoSeleccionado}
              cartId={cartId}
              setCartId={setCartId}
              onCartChange={alCambiarCarrito}
              onVolver={() => setProductoSeleccionado(null)}
            />
            {/* En el detalle, las recomendaciones van debajo y sin el reloj que se está viendo */}
            <Recomendados
              interaccionVersion={interaccionVersion}
              onVerDetalle={verDetalle}
              productoActualId={productoSeleccionado}
            />
            </>
          ) : (
            <>
              {isAdmin && (
                <AdminPanel onProductCreated={() => setCatalogVersion((v) => v + 1)} />
              )}
              <Recomendados interaccionVersion={interaccionVersion} onVerDetalle={verDetalle} />
              <ProductList
                cartId={cartId}
                setCartId={setCartId}
                onCartChange={alCambiarCarrito}
                catalogVersion={catalogVersion}
                onVerDetalle={verDetalle}
              />
            </>
          )}
          <Cart cartId={cartId} setCartId={cambiarCartId} cartVersion={cartVersion} />
          </>
          )}
        </AuthenticatedTemplate>
      </main>
    </div>
  );
}

export default App;