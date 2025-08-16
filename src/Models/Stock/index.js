// src/models/stock.model.js
import mongoose from "mongoose";

// 📦 Subdocumento para manejar lotes dentro del stock
const LoteSchema = new mongoose.Schema(
    {
      codigo: { type: String, trim: true },                // ej: N° de lote / batch
      fechaVencimiento: { type: Date },                    // opcional
      cantidad: { type: Number, required: true, min: 0 },  // cantidad en este lote
      costoUnitario: { type: Number, min: 0 },             // costo del lote (para promedio)
      notas: { type: String, trim: true }
    },
    { _id: false, timestamps: true }
  );
  
  const stockSchema = new mongoose.Schema(
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true,
        index: true,
        unique: true // un registro de stock por producto (ajústalo si usas depósitos)
      },
  
      unidadBase: { type: String, default: 'un', trim: true },
  
      controlaStockPropio: { type: Boolean, default: true },
      cantidadDisponible: { type: Number, default: 0, min: 0, required: true },
      cantidadReservada: { type: Number, default: 0, min: 0 },
      cantidadComprometida: { type: Number, default: 0, min: 0 },
  
      stockMinimo: { type: Number, default: 0, min: 0 },
      stockIdeal: { type: Number, default: 0, min: 0 },
      stockMaximo: { type: Number, default: 0, min: 0 },
  
      costoPromedio: { type: Number, default: 0, min: 0 },
      ultimoCosto: { type: Number, default: 0, min: 0 },
  
      lotes: { type: [LoteSchema], default: [] },
  
      ubicacion: { type: String, trim: true },
      ultimoMovimientoAt: { type: Date },
      notas: { type: String, trim: true },
  
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
    },
    { timestamps: true }
  );
  
  const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
  export default Stock;