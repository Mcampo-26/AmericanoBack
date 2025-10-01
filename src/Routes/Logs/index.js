// src/routes/log/index.js (o donde tengas estas rutas)
import express from "express";
import { authMiddleware } from "../../Middleware/authMiddleware.js";
import {
  listarLogs,
  registrarHeartbeat,
  sesionesDelDia,
  produccionDia,
  ocioDia,
  registrarEvento,
} from "../../controllers/logControllers/index.js";

const router = express.Router();

// Listado/consulta (puede ir sin auth si querés)
router.get("/", listarLogs);

// 🔐 proteger todo lo que necesita req.user
router.post("/heartbeat", authMiddleware, registrarHeartbeat);
router.post("/event", authMiddleware, registrarEvento);
router.get("/sesiones", authMiddleware, sesionesDelDia);
router.get("/produccion-dia", authMiddleware, produccionDia);
router.get("/ocio-dia", authMiddleware, ocioDia);

export default router;
