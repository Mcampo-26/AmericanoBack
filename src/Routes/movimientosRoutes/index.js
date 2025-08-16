// routes/movimientosRoutes/index.js
import express from "express";
import {
  listMovimientos,
  getMovimiento
} from "../../controllers/movimientoStockControllers/index.js";

import { authMiddleware } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas (historial general, si necesitás que el frontend consulte libremente)
router.get("/all", listMovimientos);

// Rutas protegidas
router.get("/:id", authMiddleware, getMovimiento);

export default router;
