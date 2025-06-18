import EstadoOrdenDeCompra from "../../Models/Ordenes/estado.js";

export const crearEstado = async (req, res) => {
  try {
    const nuevo = new EstadoOrdenDeCompra(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const obtenerEstados = async (req, res) => {
  try {
    const estados = await EstadoOrdenDeCompra.find();
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const actualizarEstado = async (req, res) => {
  try {
    const actualizado = await EstadoOrdenDeCompra.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!actualizado) return res.status(404).json({ error: "No encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const eliminarEstado = async (req, res) => {
  try {
    const eliminado = await EstadoOrdenDeCompra.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Estado eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

