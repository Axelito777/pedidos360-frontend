import { useState } from "react";
import { crearProducto } from "../api/productosApi";

function AdminPanel({ onProductCreated }) {
  const [form, setForm] = useState({
    marca: "", modelo: "", descripcion: "", precio: "", stock: "", categoria: "", imagenUrl: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearProducto({
        ...form,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock, 10),
      });
      onProductCreated();
      alert("Producto creado");
      setForm({ marca: "", modelo: "", descripcion: "", precio: "", stock: "", categoria: "", imagenUrl: "" });
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const inputClass =
    "bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors w-full";

  return (
    <div className="border border-neutral-800 rounded-xl p-6 mb-16 bg-neutral-900/20">
      <h2 className="text-lg font-black text-white mb-5 tracking-widest uppercase">
        Panel Admin — <span className="text-[#D4AF37]">Nuevo producto</span>
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <input className={inputClass} name="marca" placeholder="Marca" value={form.marca} onChange={handleChange} required />
        <input className={inputClass} name="modelo" placeholder="Modelo" value={form.modelo} onChange={handleChange} required />
        <input className={`${inputClass} md:col-span-2`} name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} required />
        <input className={inputClass} name="precio" type="number" placeholder="Precio" value={form.precio} onChange={handleChange} required />
        <input className={inputClass} name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required />
        <input className={inputClass} name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
        <input className={inputClass} name="imagenUrl" placeholder="URL imagen" value={form.imagenUrl} onChange={handleChange} />
        <button
          type="submit"
          className="md:col-span-4 bg-[#D4AF37] text-black font-black text-xs py-3 rounded-md uppercase tracking-widest hover:bg-yellow-400 transition-colors"
        >
          Crear
        </button>
      </form>
    </div>
  );
}

export default AdminPanel;