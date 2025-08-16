// routes/stockRoutes/index.js
import express from "express";
import {
  listStock,
  getStock,
  getStockByProducto,
  createStock,
  updateStock,
  deleteStock,
  movimientoStock // aplica un movimiento y actualiza stock
} from "../../controllers/stockControllers/index.js";

import { authMiddleware } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas (si querés que el frontend consulte stock sin login)
router.get("/all", listStock);
router.get("/by-producto/:productoId", getStockByProducto);

// Rutas protegidas
router.get("/:id", authMiddleware, getStock);
router.post("/create", authMiddleware, createStock);
router.put("/update/:id", authMiddleware, updateStock);
router.delete("/delete/:id", authMiddleware, deleteStock);

// Movimientos de stock
router.post("/:productoId/movimiento", authMiddleware, movimientoStock);

export default router;
