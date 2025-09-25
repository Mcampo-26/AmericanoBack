// controllers/stock.controller.js
import mongoose from "mongoose";
import Stock from "../../Models/Stock/index.js";
import {
  applyMovimiento,
  getStockByProducto as svcGetStockByProducto,
  listStock as svcListStock,
} from "../../Service/stock.js";

/**
 * GET /stock  → listado con filtros (q, lowOnly, page, limit)
 * Usa el service oficial (svcListStock) para mantener la lógica única.
 */
export const listStock = async (req, res) => {
  try {
    const { q = "", lowOnly = "false", page = 1, limit = 10 } = req.query;
    const data = await svcListStock({
      q,
      lowOnly: lowOnly === "true",
      page: Number(page),
      limit: Number(limit),
    });
    res.json(data);
  } catch (e) {
    console.error("listStock error", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /stock/:id  → detalle de un registro de stock por ID
 */
export const getStockById = async (req, res) => {
  try {
    const doc = await Stock.findById(req.params.id).populate("producto").lean();
    if (!doc) return res.status(404).json({ error: "Stock no encontrado" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /stock/by-producto/:productoId  → stock asociado a un producto
 */
export const getStockByProducto = async (req, res) => {
  try {
    const s = await svcGetStockByProducto(req.params.productoId);
    if (!s) return res.status(404).json({ error: "Stock no encontrado" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * POST /stock  → crear registro de stock
 * Emite tiempo real: stock:changed
 */
export const createStock = async (req, res) => {
  try {
    const data = await Stock.create(req.body);

    const io = req.app.locals.io;
    io?.emit?.("stock:changed", {
      productoId: data.producto,
      stock: data,
      reason: "create",
    });

    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * PUT /stock/:id  → actualizar registro de stock
 * Emite tiempo real: stock:changed
 */
export const updateStock = async (req, res) => {
  try {
    const data = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ error: 'Stock no encontrado' });

    const io = req.app.locals.io;
    const productoId = String(data.producto);
    console.log('[WS] stock:changed (update)', { stockId: String(data._id), productoId });
    io?.emit?.('stock:changed', { productoId, stock: data, reason: 'update' });

    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteStock = async (req, res) => {
  try {
    const doc = await Stock.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Stock no encontrado' });

    const io = req.app.locals.io;
    const productoId = String(doc.producto);
    console.log('[WS] stock:deleted', { productoId, stockId: String(req.params.id) });
    io?.emit?.('stock:deleted', { productoId, stockId: req.params.id });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }

};


export const movimientoStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const io = req.app.locals.io; // ✅ una vez, fuera del try

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

    // 👉 pasamos io al service para que emita allí
    const { stock, movimiento } = await applyMovimiento(
      {
        productoId,
        tipo,
        cantidad: Number(cantidad),
        unidad,
        costoUnitario: typeof costoUnitario === "number" ? costoUnitario : undefined,
        loteCodigo,
        fechaVencimiento,
        referenciaTipo,
        referenciaId,
        notas,
        usuarioId: req.user?._id,
      },
      { session, io }
    );

    await session.commitTransaction();

    // Logs (no volvemos a emitir para evitar duplicados)
    console.log("[WS] movimiento:created OK", {
      productoId: String(productoId),
      movId: String(movimiento?._id),
    });
    console.log("[WS] stock:changed OK", {
      productoId: String(productoId),
      stockId: String(stock?._id),
    });

    return res.status(201).json({ stock, movimiento });
  } catch (e) {
    await session.abortTransaction();
    return res.status(400).json({ error: e.message });
  } finally {
    session.endSession(); // ✅ aseguramos cerrar la sesión
  }
};


/**
 * GET /stock/lotes  → lista “flatten” de lotes, con agregaciones y último movimiento
 * Query: q, productoId, soloConStock
 */
export const listLotes = async (req, res) => {
  try {
    const { q, productoId, soloConStock } = req.query;

    const match = {};
    if (productoId && mongoose.isValidObjectId(productoId)) {
      match.producto = new mongoose.Types.ObjectId(productoId);
    }

    const pipe = [
      { $match: match },
      { $unwind: "$lotes" },
      ...(soloConStock === "true"
        ? [{ $match: { "lotes.cantidad": { $gt: 0 } } }]
        : []),

      { $lookup: {
          from: "productos",
          localField: "producto",
          foreignField: "_id",
          as: "prod",
        } },
      { $unwind: "$prod" },

      { $project: {
          _id: 0,
          productoId: "$producto",
          productoNombre: "$prod.nombre",
          productoCodigo: "$prod.codigo",
          loteCodigo: "$lotes.codigo",
          fechaVencimiento: "$lotes.fechaVencimiento",
          cantidad: "$lotes.cantidad",
          cantidadInicial: "$lotes.cantidadInicial",
          costoUnitarioLote: "$lotes.costoUnitario",
          origen: "$lotes.origen",
          referenciaTipo: "$lotes.referenciaTipo",
          referenciaId: "$lotes.referenciaId",
          createdBy: "$lotes.createdBy",
          createdAt: "$lotes.createdAt",
          updatedAt: "$lotes.updatedAt",
        } },

      { $lookup: {
          from: "movimientostocks",
          let: { pid: "$productoId", code: "$loteCodigo" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$producto", "$$pid"] },
                    { $eq: ["$loteCodigo", "$$code"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            {
              $group: {
                _id: null,
                totalEntradas: {
                  $sum: { $cond: [{ $gt: ["$cantidad", 0] }, "$cantidad", 0] },
                },
                totalSalidasAbs: {
                  $sum: {
                    $cond: [
                      { $lt: ["$cantidad", 0] },
                      { $abs: "$cantidad" },
                      0,
                    ],
                  },
                },
                last: { $first: "$$ROOT" },
              },
            },
          ],
          as: "movAgg",
        } },
      { $unwind: { path: "$movAgg", preserveNullAndEmptyArrays: true } },

      { $addFields: {
          cantidadInicialCalc: {
            $ifNull: ["$cantidadInicial", "$movAgg.totalEntradas"],
          },
          cantidadDescontada: {
            $cond: [
              { $ne: ["$cantidadInicial", null] },
              { $subtract: ["$cantidadInicial", "$cantidad"] },
              "$movAgg.totalSalidasAbs",
            ],
          },
          ultimoMovimiento: {
            tipo: "$movAgg.last.tipo",
            cantidad: "$movAgg.last.cantidad",
            unidad: "$movAgg.last.unidad",
            fecha: "$movAgg.last.createdAt",
            usuario: "$movAgg.last.usuario",
            notas: "$movAgg.last.notas",
            referenciaTipo: "$movAgg.last.referenciaTipo",
            referenciaId: "$movAgg.last.referenciaId",
            costoUnitario: "$movAgg.last.costoUnitario",
          },
        } },

      ...(q
        ? [
            {
              $match: {
                $or: [
                  { productoNombre: { $regex: q, $options: "i" } },
                  { loteCodigo: { $regex: q, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      { $sort: { updatedAt: -1 } },
    ];

    res.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const data = await Stock.aggregate(pipe);
    return res.json(data);
  } catch (e) {
    console.error("listLotes error", e);
    return res.status(500).json({ message: "Error al listar lotes" });
  }
};
