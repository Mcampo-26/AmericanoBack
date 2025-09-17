// controllers/stock.controller.js
import mongoose from "mongoose";
import Stock from "../../Models/Stock/index.js";
import {
  applyMovimiento,
  getStockByProducto as svcGetStockByProducto,
  listStock as svcListStock,
} from "../../Service/stock.js";

/** GET /stock/all */
export const listStock = async (req, res) => {
  try {
    const { q, lowOnly } = req.query;
    const data = await svcListStock({ q, lowOnly: lowOnly === "true" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** GET /stock/:id */
export const getStock = async (req, res) => {
  try {
    const s = await Stock.findById(req.params.id)
      .populate("producto", "nombre codigo codigoBarras");
    if (!s) return res.status(404).json({ error: "Stock no encontrado" });

    // 👇 evita 304 y cache del navegador/proxy
    res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.json(s);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};


/** GET /stock/by-producto/:productoId */
export const getStockByProducto = async (req, res) => {
  try {
    const s = await svcGetStockByProducto(req.params.productoId);
    if (!s) return res.status(404).json({ error: "Stock no encontrado" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** POST /stock/create */
export const createStock = async (req, res) => {
  try {
    const data = await Stock.create(req.body);
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** PUT /stock/update/:id */
export const updateStock = async (req, res) => {
  try {
    const data = await Stock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!data) return res.status(404).json({ error: "Stock no encontrado" });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** DELETE /stock/delete/:id */
export const deleteStock = async (req, res) => {
  try {
    const ok = await Stock.findByIdAndDelete(req.params.id);
    if (!ok) return res.status(404).json({ error: "Stock no encontrado" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** POST /stock/:productoId/movimiento */
export const movimientoStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productoId } = req.params;
    const {
      tipo,
      cantidad,
      unidad,
      costoUnitario,
      loteCodigo,
      fechaVencimiento,
      referenciaTipo,
      referenciaId,
      notas,
    } = req.body;

    const { stock, movimiento } = await applyMovimiento(
      {
        productoId,
        tipo,
        cantidad: Number(cantidad),
        unidad,
        costoUnitario:
          typeof costoUnitario === "number" ? costoUnitario : undefined,
        loteCodigo,
        fechaVencimiento,
        referenciaTipo,
        referenciaId,
        notas,
        usuarioId: req.user?._id, // si usás auth
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ stock, movimiento });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
};




export const listLotes = async (req, res) => {
  try {
    const { q, productoId, soloConStock } = req.query;
    const match = {};
    if (productoId && mongoose.isValidObjectId(productoId)) {
      match.producto = new mongoose.Types.ObjectId(productoId);
    }

    const pipe = [
      { $match: match },
      { $unwind: '$lotes' },
      ...(soloConStock === 'true' ? [{ $match: { 'lotes.cantidad': { $gt: 0 } } }] : []),

      { $lookup: { from: 'productos', localField: 'producto', foreignField: '_id', as: 'prod' } },
      { $unwind: '$prod' },

      { $project: {
        _id: 0,
        productoId: '$producto',
        productoNombre: '$prod.nombre',
        productoCodigo: '$prod.codigo',
        loteCodigo: '$lotes.codigo',
        fechaVencimiento: '$lotes.fechaVencimiento',
        cantidad: '$lotes.cantidad',
        cantidadInicial: '$lotes.cantidadInicial',
        costoUnitarioLote: '$lotes.costoUnitario',
        origen: '$lotes.origen',
        referenciaTipo: '$lotes.referenciaTipo',
        referenciaId: '$lotes.referenciaId',
        createdBy: '$lotes.createdBy',
        createdAt: '$lotes.createdAt',
        updatedAt: '$lotes.updatedAt'
      }},

      { $lookup: {
        from: 'movimientostocks',
        let: { pid: '$productoId', code: '$loteCodigo' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ['$producto', '$$pid'] },
            { $eq: ['$loteCodigo', '$$code'] }
          ]}} },
          { $sort: { createdAt: -1, _id: -1 } },
          { $group: { _id: null,
            totalEntradas:   { $sum: { $cond: [{ $gt: ['$cantidad', 0] }, '$cantidad', 0] } },
            totalSalidasAbs: { $sum: { $cond: [{ $lt: ['$cantidad', 0] }, { $abs: '$cantidad' }, 0] } },
            last: { $first: '$$ROOT' }
          } }
        ],
        as: 'movAgg'
      }},
      { $unwind: { path: '$movAgg', preserveNullAndEmptyArrays: true } },

      { $addFields: {
        cantidadInicialCalc: { $ifNull: ['$cantidadInicial', '$movAgg.totalEntradas'] },
        cantidadDescontada: {
          $cond: [{ $ne: ['$cantidadInicial', null] },
            { $subtract: ['$cantidadInicial', '$cantidad'] },
            '$movAgg.totalSalidasAbs'
        ]},
        ultimoMovimiento: {
          tipo: '$movAgg.last.tipo',
          cantidad: '$movAgg.last.cantidad',
          unidad: '$movAgg.last.unidad',
          fecha: '$movAgg.last.createdAt',
          usuario: '$movAgg.last.usuario',
          notas: '$movAgg.last.notas',
          referenciaTipo: '$movAgg.last.referenciaTipo',
          referenciaId: '$movAgg.last.referenciaId',
          costoUnitario: '$movAgg.last.costoUnitario'
        }
      }},

      ...(q ? [{
        $match: { $or: [
          { productoNombre: { $regex: q, $options: 'i' } },
          { loteCodigo: { $regex: q, $options: 'i' } }
        ]}
      }] : []),

      { $sort: { updatedAt: -1 } }
    ];

    res.set('Cache-Control','no-store, max-age=0, must-revalidate');
    res.set('Pragma','no-cache'); res.set('Expires','0');

    const data = await Stock.aggregate(pipe);
    return res.json(data);
  } catch (e) {
    console.error('listLotes error', e);
    return res.status(500).json({ message: 'Error al listar lotes' });
  }
};
