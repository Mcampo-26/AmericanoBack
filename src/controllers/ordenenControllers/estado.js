// src/controllers/estadoOrden.controller.js
import EstadoOrden from "../../Models/Ordenes/estado.js";

export const crearEstado = async (req, res) => {
  try {
    const doc = await EstadoOrden.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const obtenerEstados = async (_req, res) => {
  try {
    const estados = await EstadoOrden.find().sort({ estado: 1 });
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actualizarEstado = async (req, res) => {
  try {
    const upd = await EstadoOrden.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!upd) return res.status(404).json({ error: "No encontrado" });
    res.json(upd);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const eliminarEstado = async (req, res) => {
  try {
    const del = await EstadoOrden.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Estado eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
