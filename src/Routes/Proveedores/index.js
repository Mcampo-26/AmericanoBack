// routes/proveedores/index.js
import express from "express";
import {
  crearProveedor,
  obtenerProveedores,
  obtenerProveedorPorId,
  actualizarProveedor,
  eliminarProveedor
} from "../../controllers/proveedoresControlles/index.js";

const router = express.Router();

// Crear proveedor
router.post("/create", crearProveedor);

// Obtener todos los proveedores
router.get("/get", obtenerProveedores);

// Obtener uno por ID
router.get("/:id", obtenerProveedorPorId);

// Actualizar proveedor
router.put("/:id", actualizarProveedor);

// Eliminar proveedor
router.delete("/:id", eliminarProveedor);

export default router;
