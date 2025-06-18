import express from 'express';
import {
  crearUnidad,
  obtenerUnidades,
  eliminarUnidad,
  actualizarUnidad,
  getUnidadPorId
} from '../../controllers/unidadDeMedidaController/index.js';

const router = express.Router();

// ⚠️ Solo va el subpath
router.get('/get', obtenerUnidades);
router.get('/:id', getUnidadPorId); // 👈 esta línea nueva
router.post('/create', crearUnidad);
router.delete('/:id', eliminarUnidad);
router.put('/:id', actualizarUnidad);

export default router;
