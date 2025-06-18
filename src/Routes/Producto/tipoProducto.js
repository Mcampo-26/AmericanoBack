import express from "express";
import { crearTipo, obtenerTipos, eliminarTipo,actualizarTipo,obtenerTipoPorId } from "../../controllers/productoControllers/tipoProducto.js";


const router = express.Router();

router.post("/create", crearTipo);
router.get("/get", obtenerTipos);
router.delete("/:id", eliminarTipo);
router.put('/:id', actualizarTipo); // 👈 esto faltaba
router.get('/:id', obtenerTipoPorId); // 👈 agregá esta línea

export default router;