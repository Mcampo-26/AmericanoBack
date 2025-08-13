import mongoose from "mongoose";

const procesoProduccionSchema = new mongoose.Schema({
  recetaId: { type: mongoose.Schema.Types.ObjectId, ref: "Receta" },
  nombreReceta: { type: String, required: true },

  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  usuarioNombre: { type: String, required: true },

  duracionMs: { type: Number, default: 0 },     // duración objetivo
  acumuladoMs: { type: Number, default: 0 },    // tiempo acumulado previo
  startedAt:   { type: Date, default: null },   // si está corriendo
  status: { 
    type: String,
    enum: ["en_proceso", "pausado", "finalizado"],
    default: "en_proceso"
  },

  minimized: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("ProcesoProduccion", procesoProduccionSchema);
