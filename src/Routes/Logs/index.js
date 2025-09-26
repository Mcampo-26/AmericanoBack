import express from "express";
import {
  listarLogs,
  registrarHeartbeat,
  sesionesDelDia,
  produccionDia,
  ocioDia,
  registrarEvento,    
} from "../../controllers/logControllers/index.js";

const router = express.Router();

// Listado/consulta
router.get("/", listarLogs);

// Heartbeat de UI
router.post("/heartbeat", registrarHeartbeat);
router.post("/event", registrarEvento);

// Paneles (opcionales)
router.get("/sesiones", sesionesDelDia);
router.get("/produccion-dia", produccionDia);
router.get("/ocio-dia", ocioDia);


export default router;
