import UnidadDeMedida from "../../Models/UnidadesMedida/index.js";

export const crearUnidad = async (req, res) => {
  try {
    const nueva = new UnidadDeMedida(req.body);
    await nueva.save();
    res.status(201).json(nueva);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const obtenerUnidades = async (req, res) => {
  try {
    const unidades = await UnidadDeMedida.find();
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnidadPorId = async (req, res) => {
  try {
    const unidad = await UnidadDeMedida.findById(req.params.id);
    if (!unidad) return res.status(404).json({ error: "No encontrada" });
    res.json(unidad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarUnidad = async (req, res) => {
  try {
    const eliminado = await UnidadDeMedida.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrada" });
    res.json({ mensaje: "Unidad eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarUnidad = async (req, res) => {
  try {
    const actualizada = await UnidadDeMedida.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!actualizada) return res.status(404).json({ error: "No encontrada" });
    res.json(actualizada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
