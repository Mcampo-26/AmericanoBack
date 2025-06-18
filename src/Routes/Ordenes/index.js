import express from "express";
import {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarOrden,
  eliminarOrden
} from "../../controllers/ordenenControllers/index.js";
const router = express.Router();

router.post("/create", crearOrden);
router.get("/get", obtenerOrdenes);
router.get("/:id", obtenerOrdenPorId);
router.put("/:id", actualizarOrden);
router.delete("/:id", eliminarOrden);

export default router;
