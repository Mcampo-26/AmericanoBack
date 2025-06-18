import tipoProducto from "../../Models/Producto/tipoProducto.js";

export const crearTipo = async (req, res) => {
  try {
    const nuevo = new tipoProducto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const obtenerTipos = async (req, res) => {
  try {
    const tipos = await tipoProducto.find();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const obtenerTipoPorId = async (req, res) => {
  try {
    const tipo = await tipoProducto.findById(req.params.id);
    if (!tipo) return res.status(404).json({ error: "No encontrado" });
    res.json(tipo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarTipo = async (req, res) => {
  try {
    const actualizado = await tipoProducto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!actualizado) return res.status(404).json({ error: "No encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarTipo = async (req, res) => {
  try {
    const eliminado = await tipoProducto.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Tipo eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};