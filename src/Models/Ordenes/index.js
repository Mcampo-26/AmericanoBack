// models/OrdenDeCompra.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidadSolicitada: { type: Number, required: true },
  precioUnitarioAcordado: { type: Number, required: true },
  unidadMedida: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadDeMedida', required: true }
});

const ordenDeCompraSchema = new mongoose.Schema({
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
  fechaCreacion: { type: Date, default: Date.now },
  fechaEntregaEstimada: Date,
  observaciones: String,
  estado: { type: mongoose.Schema.Types.ObjectId, ref: 'EstadoOrdenDeCompra', required: true },
  items: [itemSchema]
});

const OrdenDeCompra = mongoose.model("OrdenDeCompra", ordenDeCompraSchema);
export default OrdenDeCompra;
