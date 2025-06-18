import Proveedores from "../../Models/Proveedores/index.js";

// Crear un nuevo proveedor
export const crearProveedor = async (req, res) => {
  try {
    const nuevoProveedores = new Proveedores(req.body);
    await nuevoProveedores.save();
    res.status(201).json(nuevoProveedores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener todos los proveedores
export const obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedores.find();
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un proveedor por ID
export const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedores = await Proveedores.findById(req.params.id);
    if (!proveedores) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un proveedor
export const actualizarProveedor = async (req, res) => {
  try {
    const proveedorActualizado = await Proveedores.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(proveedorActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un proveedor
export const eliminarProveedor = async (req, res) => {
  try {
    const proveedorEliminado = await Proveedores.findByIdAndDelete(req.params.id);
    if (!proveedorEliminado) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
