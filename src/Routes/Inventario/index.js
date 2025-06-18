import express from 'express';
import {
  crearInventario,
  obtenerInventario,
  actualizarInventario,
  eliminarInventario
} from '../../controllers/inventarioController/index.js';

const router = express.Router();

router.get('/get', obtenerInventario);
router.post('/create', crearInventario);
router.put('/:id', actualizarInventario);
router.delete('/:id', eliminarInventario);

export default router;
