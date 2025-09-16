// routes/compraRoutes.js
import express from 'express';
import {
  crearCompra,
  obtenerCompras,
  getCompraPorId,
  eliminarCompra
} from '../../controllers/comprasControlles/index.js';

const router = express.Router();

router.post('/create', crearCompra);
router.get('/get', obtenerCompras);
router.get('/:id', getCompraPorId);
router.delete("/:id", eliminarCompra); //

export default router;