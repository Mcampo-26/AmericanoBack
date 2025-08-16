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
    const s = await Stock.findById(req.params.id).populate(
      "producto",
      "nombre codigo codigoBarras"
    );
    if (!s) return res.status(404).json({ error: "Stock no encontrado" });
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
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
