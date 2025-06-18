import express from "express";
import { crearEstado, obtenerEstados, eliminarEstado,actualizarEstado } from "../../controllers/ordenenControllers/estado.js"

const router = express.Router();

router.post("/create", crearEstado);
router.get("/get", obtenerEstados);
router.delete("/:id", eliminarEstado);
router.put('/:id', actualizarEstado);

export default router;