// Models/Receta/index.js
import mongoose from "mongoose";

const ingredienteSchema = new mongoose.Schema({
  nombre:    { type: String, required: true },
  cantidad:  { type: Number, required: true },  // para el rindeBase
  unidad:    { type: String, required: true },  // Ej: 'Kg','Gr','Un','Lt','Ml','Cc'
  productoId:{ type: mongoose.Schema.Types.ObjectId, ref: "Producto" } // ⬅️ opcional
}, { _id:false });

const recetaSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, unique: true },
  descripcion: { type: String, default: "" },
  ingredientes: { type: [ingredienteSchema], default: [] },

  // ⬇️ NUEVOS
  rindeBase:   { type: Number, default: 1, min: 1 },                         // ⬅️ clave para escalar
  productoFinal:{ type: mongoose.Schema.Types.ObjectId, ref: "Producto" },   // ⬅️ opcional
  unidadOutput: { type: String, default: "Un" },                              // ⬅️ opcional

  tiempoProduccion: { type: Number, default: 0, min: 0 }, // minutos
  activo: { type: Boolean, default: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
}, { timestamps: true });

export default mongoose.model("Receta", recetaSchema);
