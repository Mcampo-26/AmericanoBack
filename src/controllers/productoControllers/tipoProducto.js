// controllers/tipoProducto.controller.js
import TipoProducto from "../../Models/Producto/tipoProducto.js";

const ALLOWED = [
  "nombreTipo", "esVendibleDirectamente", "esIngredientePotencial",
  "esDesperdicio", "esComprable", "controlaLotes", "unidadBase",
  "perecedero", "vidaUtilDias", "requiereReceta", "estrategiaCosto",
  "stockMinimo", "stockIdeal", "stockMaximo", "descripcion", "codigo"
];
const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]).filter(([,v]) => v !== undefined));

export const crearTipo = async (req, res) => {
  try {
    const body = pick(req.body, ALLOWED);
    const nuevo = await TipoProducto.create(body);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "nombreTipo duplicado" });
    res.status(400).json({ error: err.message });
  }
};

export const obtenerTipos = async (_req, res) => {
  try {
    const tipos = await TipoProducto.find().lean();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const obtenerTipoPorId = async (req, res) => {
  try {
    const tipo = await TipoProducto.findById(req.params.id).lean();
    if (!tipo) return res.status(404).json({ error: "No encontrado" });
    res.json(tipo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarTipo = async (req, res) => {
  try {
    const body = pick(req.body, ALLOWED);
    const actualizado = await TipoProducto.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    if (!actualizado) return res.status(404).json({ error: "No encontrado" });
    res.json(actualizado);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "nombreTipo duplicado" });
    res.status(500).json({ error: err.message });
  }
};

export const eliminarTipo = async (req, res) => {
  try {
    const eliminado = await TipoProducto.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Tipo eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
