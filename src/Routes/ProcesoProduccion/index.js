// src/Routes/ProcesoProduccion/index.js
import { Router } from "express";
import { authMiddleware } from "../../Middleware/authMiddleware.js";
import {
  listarProcesos,
  crearProceso,
  setMinimized,
  pausarProceso,
  reanudarProceso,
  finalizarProceso,
  actualizarProcesoParcial, // 👈 NUEVO
  eliminarProceso,  
  cancelarProceso        // 👈 opcional
} from "../../controllers/ProcesoProduccionControllers/index.js";

const router = Router();

// Todas las rutas requieren auth
router.use(authMiddleware);

// CRUD básico
router.get("/", listarProcesos);
router.post("/", crearProceso);

// ✅ PATCH genérico (para actualizar status, remainingMs, minimized, etc.)
router.patch("/:id", actualizarProcesoParcial);
router.patch("/:id/cancelar", cancelarProceso);
// (opcional) DELETE por id
router.delete("/:id", eliminarProceso);

// Endpoints específicos que ya tenías
router.patch("/:id/minimize", setMinimized);
router.patch("/:id/pausar", pausarProceso);
router.patch("/:id/reanudar", reanudarProceso);
router.patch("/:id/finalizar", finalizarProceso);

export default router;
