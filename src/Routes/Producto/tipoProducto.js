// src/Routes/TipoProducto/index.js
import express from "express";
import mongoose from "mongoose";
import {
  crearTipo,
  obtenerTipos,
  eliminarTipo,
  actualizarTipo,
  obtenerTipoPorId,
} from "../../controllers/productoControllers/tipoProducto.js";

const router = express.Router();

// --- middleware para validar ObjectId ---
function validarObjectId(req, res, next) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  next();
}

// Rutas fijas primero
router.get("/get", obtenerTipos);
router.post("/create", crearTipo);

// Luego las rutas con :id (sin regex en el path)
router.get("/:id", validarObjectId, obtenerTipoPorId);
router.put("/update/:id", validarObjectId, actualizarTipo);
router.delete("/delete/:id", validarObjectId, eliminarTipo);

export default router;
