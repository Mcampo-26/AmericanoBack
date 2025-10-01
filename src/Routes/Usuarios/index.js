// src/routes/usuarios/index.js
import express from 'express';
import {
  createUsuario,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
  verifyUsuario,
  loginUsuario,
  logoutUsuario,                 // 👈 agregar
} from '../../controllers/usuariosControllers/index.js';
import { authMiddleware } from '../../Middleware/authMiddleware.js'; // 👈 usar tu middleware

const router = express.Router();

// 🔐 Auth
router.post('/login', loginUsuario);
router.post('/verificar', verifyUsuario);
router.post('/logout', authMiddleware, logoutUsuario); // 👈 proteger y loguear

// 📌 CRUD
router.post('/create', createUsuario);
router.get('/', getUsuarios);
router.put('/update/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

export default router;
