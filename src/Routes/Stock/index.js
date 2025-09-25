// src/Routes/Stock/index.js
import express from "express";
import {
  listStock,          // GET /stock        (lista con q/lowOnly/page/limit)
  getStockById,       // GET /stock/:id    (detalle)
  getStockByProducto, // GET /stock/by-producto/:productoId
  listLotes,          // GET /stock/lotes
  createStock,        // POST /stock
  updateStock,        // PUT /stock/:id
  deleteStock,        // DELETE /stock/:id
  movimientoStock,    // POST /stock/:productoId/movimiento
} from "../../controllers/stockControllers/index.js"; // 👈 ruta y nombres correctos
import { authMiddleware } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// específicas primero
router.get("/lotes", authMiddleware, listLotes);
router.get("/by-producto/:productoId", authMiddleware, getStockByProducto);
router.post("/:productoId/movimiento", authMiddleware, movimientoStock);

// CRUD REST
router.get("/", authMiddleware, listStock);
router.get("/:id", authMiddleware, getStockById);
router.post("/", authMiddleware, createStock);
router.put("/:id", authMiddleware, updateStock);
router.delete("/:id", authMiddleware, deleteStock);

export default router;
