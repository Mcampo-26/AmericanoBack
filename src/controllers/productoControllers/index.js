import { Producto } from "../../Models/Producto/index.js";
import Stock from '../../Models/Stock/index.js';




export const crearProducto = async (req, res) => {
  try {
    const nuevo = await Producto.create(req.body); // crea y guarda en Mongo
    res.status(201).json(nuevo);

  } catch (err) {
    console.error("❌ Error al crear producto:", err);

    // 🔎 Si es un error de validación de Mongoose
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Error de validación",
        errors: Object.keys(err.errors).map((campo) => ({
          campo,
          detalle: err.errors[campo].message
        }))
      });
    }

    // 🔎 Si es un error por duplicado de clave (índice unique)
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Producto duplicado",
        duplicado: err.keyValue
      });
    }

    // 🔎 Otros errores
    res.status(400).json({ message: "Error al crear producto", detalle: err.message });
  }
};


// Listar + stock (join manual optimizado)
const filtroActivos = { $or: [{ activo: true }, { activo: { $exists: false } }] };



export const obtenerProductos = async (_req, res) => {
  try {
    const [productos, stocks] = await Promise.all([
      Producto.find({ activo: true }) // o tu filtroActivos
        .populate("tipoProducto", "nombreTipo")
        .populate("proveedores.proveedorPrincipal", "comercial.razonSocial")
        .populate("produccion.recetaBase", "nombreReceta")
        .lean(),
      Stock.find({}, "producto cantidadDisponible").lean(), // <-- usar Stock
    ]);

    const invMap = new Map(stocks.map(s => [String(s.producto), s.cantidadDisponible || 0]));
    const productosConStock = productos.map(p => ({
      ...p,
      stockDisponible: invMap.get(String(p._id)) || 0,
    }));

    res.json(productosConStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// (opcional) también en obtenerProductoPorId:
export const obtenerProductoPorId = async (req, res) => {
  try {
    const prod = await Producto.findById(req.params.id)
      .populate("tipoProducto", "nombreTipo")
      .populate("proveedores.proveedorPrincipal", "comercial.razonSocial")
      .populate("produccion.recetaBase", "nombreReceta");
    if (!prod || prod.activo === false) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(prod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar
export const actualizarProducto = async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!actualizado) return res.status(404).json({ error: "No encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar (lógico)
export const eliminarProducto = async (req, res) => {
  try {
    const eliminado = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Producto desactivado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
