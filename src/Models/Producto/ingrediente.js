// models/Ingrediente.js
import mongoose from "mongoose";

// 🔹 Subdoc: stock / unidad
const stockSchema = new mongoose.Schema({
  unidadBase: { type: mongoose.Schema.Types.ObjectId, ref: "UnidadDeMedida", required: true },
  stockActual: { type: Number, default: 0 },
  stockMinimo: { type: Number, default: 0 },
  ubicacion: { type: String, trim: true, default: "" }, // opcional (depósito/estante)
}, { _id: false });

// 🔹 Subdoc: costos
const costosSchema = new mongoose.Schema({
  costoUnitario: { type: Number, default: 0 }, // por unidadBase
  costoPromedio: { type: Number, default: 0 },
}, { _id: false });

// 🔹 Subdoc: proveedores
const proveedoresSchema = new mongoose.Schema({
  proveedorPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: "Proveedor" },
  alternativos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proveedor" }],
}, { _id: false });

// 🔹 Esquema principal
const ingredienteSchema = new mongoose.Schema({
  // Insumo asociado a un tipo de producto del catálogo
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },

  nombreInterno: { type: String, trim: true, default: "" }, // alias opcional
  esPerecedero: { type: Boolean, default: false },
  vidaUtilDias: { type: Number, default: 0 },               // si es perecedero

  stock: stockSchema,
  costos: costosSchema,
  proveedores: proveedoresSchema,

  activo: { type: Boolean, default: true },
}, { timestamps: true });

// Índices
ingredienteSchema.index(
  { producto: 1 },
  { unique: true, partialFilterExpression: { activo: true } } // un ingrediente activo por producto
);
ingredienteSchema.index({ nombreInterno: 1 }, { sparse: true });

const Ingrediente = mongoose.models.Ingrediente || mongoose.model("Ingrediente", ingredienteSchema);
export default Ingrediente;
