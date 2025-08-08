// Models/Receta/index.js
import mongoose from "mongoose";

const ingredienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad:   { type: String, required: true },
}, { _id:false });

const recetaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: "" },
  ingredientes: { type: [ingredienteSchema], default: [] },

  // ⬇️ NUEVO: minutos de producción
  tiempoProduccion: { type: Number, default: 0, min: 0 }, // minutos

  activo: { type: Boolean, default: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
}, { timestamps: true });

export default mongoose.model("Receta", recetaSchema);
