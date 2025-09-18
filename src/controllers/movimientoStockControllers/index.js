// controllers/movimientoStock.controller.js
import MovimientoStock from '../../Models/MovimientoStock/index.js';

/** GET /movimientos/all */
export const listMovimientos = async (req, res) => {
  try {
    // 🔒 no cache (igual que en listLotes)
    res.set('Cache-Control','no-store, max-age=0, must-revalidate');
    res.set('Pragma','no-cache'); res.set('Expires','0');

    const { productoId, tipo, refTipo, refId, limit = 100 } = req.query;
    const filter = {};
    if (productoId) filter.producto = productoId;        // Mongoose castea a ObjectId
    if (tipo) filter.tipo = tipo;
    if (refTipo) filter.referenciaTipo = refTipo;
    if (refId) filter.referenciaId = refId;

    const data = await MovimientoStock.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(Math.min(Number(limit) || 100, 200))
      .populate('producto', 'nombre codigo codigoBarras')
      .populate('usuario', 'nombre')
      .lean();

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
/** GET /movimientos/:id */
export const getMovimiento = async (req, res) => {
  try {
    const mov = await MovimientoStock.findById(req.params.id)
      .populate('producto', 'nombre codigo codigoBarras')
      .populate('usuario', 'nombre');

    if (!mov) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json(mov);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
