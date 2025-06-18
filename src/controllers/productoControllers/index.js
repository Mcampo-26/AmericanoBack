import Producto from "../../Models/Producto/index.js";
import Inventario from "../../Models/Inventario/index.js";
export const crearProducto = async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().populate("tipoProducto").lean(); // lean para poder modificar
    const inventario = await Inventario.find();

    const productosConStock = productos.map((producto) => {
      const registroStock = inventario.find(
        (inv) => inv.producto.toString() === producto._id.toString()
      );

      return {
        ...producto,
        stockDisponible: registroStock?.cantidadDisponible || 0
      };
    });

    res.json(productosConStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const obtenerProductoPorId = async (req, res) => {
  try {
    const prod = await Producto.findById(req.params.id).populate("tipoProducto");
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(prod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const eliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
