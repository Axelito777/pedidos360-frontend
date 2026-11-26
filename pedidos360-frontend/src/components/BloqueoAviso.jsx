import { mensajeBloqueo } from "../utils/bloqueo";

// Aviso de cuenta bloqueada por el antifraude (se muestra mientras dure el bloqueo)
function BloqueoAviso({ hasta }) {
  return (
    <div role="alert" className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-300">
      <p className="font-bold text-red-200 mb-1">Compras deshabilitadas</p>
      <p>{mensajeBloqueo(hasta)} Mientras tanto no puedes pagar ni confirmar el carrito.</p>
    </div>
  );
}

export default BloqueoAviso;
