import Inventario from '../../Models/Inventario/index.js';

// Crear entrada de stock
export const crearInventario = async (req, res) => {
  try {
    const nuevo = new Inventario(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todos los stocks
export const obtenerInventario = async (req, res) => {
  try {
    const lista = await Inventario.find().populate('producto', 'nombre');
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar stock (por ejemplo al ingresar productos)
export const actualizarInventario = async (req, res) => {
  try {
    const actualizado = await Inventario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar stock
export const eliminarInventario = async (req, res) => {
  try {
    const eliminado = await Inventario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Stock eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
