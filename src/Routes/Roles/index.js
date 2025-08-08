import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole
} from "../../controllers/rolesControllers/index.js";

import { authMiddleware } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas (para que funcione lo que ya hace el frontend)
router.post('/create', createRole);
router.get('/all', getAllRoles);

// Rutas protegidas
router.get("/:id", authMiddleware, getRoleById);
router.put("/update/:id", authMiddleware, updateRole);
router.delete("/delete/:id", authMiddleware, deleteRole);

export default router;
