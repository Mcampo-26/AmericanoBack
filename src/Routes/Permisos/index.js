import express from 'express';
import {
  createOrUpdateRolePermissions,
  getRolePermissions,
  updateRolePermissions,
  deleteRoleById
} from '../../controllers/permisosControllers/index.js'; // asegurate que el path es correcto

const router = express.Router();

// Crear o actualizar un rol con permisos
router.post('/createOrUpdate', createOrUpdateRolePermissions);

// Obtener los permisos de un rol por su ID
router.get('/permissions/:id', getRolePermissions);

// Actualizar solo los permisos de un rol existente
router.put('/permissions/:id', updateRolePermissions);

// Eliminar un rol por ID
router.delete('/delete/:id', deleteRoleById);

export default router;
