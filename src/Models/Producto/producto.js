// models/Producto.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  controlaStockPropio: { type: Boolean, default: true },
  stockActual: { type: Number, default: 0 },
  stockMinimo: { type: Number, default: 0 },
  stockMaximo: { type: Number, default: 0 },

  // 🔁 CAMBIO: de enum String → ObjectId a Unidad
  unidadVenta: { type: mongoose.Schema.Types.ObjectId, ref: "Unidad", default: null },
}, { _id: false });

const preciosSchema = new mongoose.Schema({
  precioLista: { type: Number, default: 0 },
  ivaAlicuota: { type: Number, default: 21 },
  aceptaDescuento: { type: Boolean, default: true },
  costoUltimaCompra: { type: Number, default: 0 },
  costoPromedio: { type: Number, default: 0 },
  margenSugerido: { type: Number, default: 0 },
}, { _id: false });

// (si querés también dinámica la de producción, hacé lo mismo aquí)
const produccionSchema = new mongoose.Schema({
  esElaborado: { type: Boolean, default: false },
  recetaBase: { type: mongoose.Schema.Types.ObjectId, ref: "Receta" },
  unidadOutput: { type: String, enum: ["Un","Kg","Gr","Lt","Ml","Cc"], default: "Un" }, // o ref si querés
  tasaMermaPct: { type: Number, default: 0 },
  esIngredientePotencial: { type: Boolean, default: false },
  esDesperdicio: { type: Boolean, default: false },
}, { _id: false });

const proveedoresSchema = new mongoose.Schema({
  proveedorPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: "Proveedor" },
  proveedoresAlternativos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proveedor" }],
}, { _id: false });

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: "" },
  codigo: { type: String, trim: true },
  codigoBarras: { type: String, trim: true },
  tipoProducto: { type: mongoose.Schema.Types.ObjectId, ref: "TipoProducto" },
  esVendibleDirectamente: { type: Boolean, default: false },
  stock: stockSchema,
  precios: preciosSchema,
  produccion: produccionSchema,
  proveedores: proveedoresSchema,
  activo: { type: Boolean, default: true },
}, { timestamps: true });

productoSchema.index({ nombre: 1 }, { unique: true, partialFilterExpression: { activo: true } });
productoSchema.index({ codigo: 1 }, { unique: true, sparse: true });
productoSchema.index({ codigoBarras: 1 }, { unique: true, sparse: true });

export default mongoose.models.Producto || mongoose.model("Producto", productoSchema);
