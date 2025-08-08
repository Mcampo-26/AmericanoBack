import express from "express";
import { authMiddleware } from "../../Middleware/authMiddleware.js";
import { cargarUsuarioConPermisos } from "../../Middleware/cargarUsuarioConPermisos.js";
import { validarPermiso } from "../../Middleware/validarPermiso.js";
import {
  crearReceta,
  obtenerRecetas,
  obtenerRecetaPorId,
  actualizarReceta,
  eliminarReceta,
} from "../../controllers/recetaControllers/index.js";

const router = express.Router();

router.use(authMiddleware, cargarUsuarioConPermisos);

router.get("/",    validarPermiso("viewReceta"),    obtenerRecetas);
router.get("/:id", validarPermiso("viewReceta"),    obtenerRecetaPorId);
router.post("/",   validarPermiso("createReceta"),  crearReceta);
router.put("/:id", validarPermiso("updateReceta"),  actualizarReceta);
router.delete("/:id", validarPermiso("deleteReceta"), eliminarReceta);

export default router;
