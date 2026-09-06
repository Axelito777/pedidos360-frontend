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

  return (
    <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
      <h2>Panel Admin — Nuevo producto</h2>
      <form onSubmit={handleSubmit}>
        <input name="marca" placeholder="Marca" value={form.marca} onChange={handleChange} required />
        <input name="modelo" placeholder="Modelo" value={form.modelo} onChange={handleChange} required />
        <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} required />
        <input name="precio" type="number" placeholder="Precio" value={form.precio} onChange={handleChange} required />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required />
        <input name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
        <input name="imagenUrl" placeholder="URL imagen" value={form.imagenUrl} onChange={handleChange} />
        <button type="submit">Crear</button>
      </form>
    </div>
  );
}

export default AdminPanel;