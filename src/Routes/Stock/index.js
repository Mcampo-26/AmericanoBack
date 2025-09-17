// routes/stockRoutes/index.js
import express from "express";
import {
  listStock,
  getStock,
  getStockByProducto,
  createStock,
  updateStock,
  deleteStock,
  movimientoStock,
  listLotes
} from "../../controllers/stockControllers/index.js";
import { authMiddleware } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// públicas
router.get("/all", listStock);
router.get("/by-producto/:productoId", getStockByProducto);
router.get("/", getStock);
// ⚠️ específicas SIEMPRE antes de los params genéricos
router.get("/lotes", authMiddleware, listLotes);

// protegidas
router.get("/:id", authMiddleware, getStock);
router.post("/create", authMiddleware, createStock);
router.put("/update/:id", authMiddleware, updateStock);
router.delete("/delete/:id", authMiddleware, deleteStock);

// movimientos
router.post("/:productoId/movimiento", authMiddleware, movimientoStock);

export default router;
