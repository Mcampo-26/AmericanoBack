import express from 'express';
import {
  createUsuario,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
  verifyUsuario,
  loginUsuario
} from '../../controllers/usuariosControllers/index.js';

const router = express.Router();

// 🔐 Autenticación
router.post('/login', loginUsuario);
router.post('/verificar', verifyUsuario);

// 📌 CRUD de usuarios
router.post('/create', createUsuario); // ✅ ahora usa /usuarios/create
router.get('/', getUsuarios);
router.put('/update/:id', updateUsuario); 


router.delete('/:id', deleteUsuario);

export default router;
