// src/Models/TipoProducto/index.js
import mongoose from "mongoose";

const tipoProductoSchema = new mongoose.Schema(
  {
    nombreTipo: { type: String, required: true, unique: true, trim: true },

    // Comportamiento / uso
    esVendibleDirectamente: { type: Boolean, default: false },
    esIngredientePotencial: { type: Boolean, default: false },
    esDesperdicio:         { type: Boolean, default: false },
    esComprable:           { type: Boolean, default: true },

    // Stock / Lotes
    controlaLotes: { type: Boolean, default: false },
    unidadBase:    { type: String,  default: "un", trim: true },

    // Perecederos
    perecedero:   { type: Boolean, default: false },
    vidaUtilDias: { type: Number,  default: 0, min: 0 },

    // Producción
    requiereReceta: { type: Boolean, default: false },

    // Estrategia de costos (para Strategy)
    estrategiaCosto: {
      type: String,
      enum: ["fijo", "promedio", "maximo"],
      default: "promedio",
    },

    // Umbrales por defecto (se pueden copiar al crear Producto)
    stockMinimo: { type: Number, default: 0, min: 0 },
    stockIdeal:  { type: Number, default: 0, min: 0 },
    stockMaximo: { type: Number, default: 0, min: 0 },
    
    descripcion: { type: String, trim: true },
    codigo:      { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.TipoProducto
  || mongoose.model("TipoProducto", tipoProductoSchema);
