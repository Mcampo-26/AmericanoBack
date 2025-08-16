import mongoose from 'mongoose';

const movimientoStockSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true, index: true },
    stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },

    tipo: {
      type: String,
      enum: ['compra', 'venta', 'produccion', 'ajuste', 'merma', 'devolucion_in', 'devolucion_out'],
      required: true
    },

    cantidad: { type: Number, required: true }, // + entra / - sale
    unidad: { type: String, default: 'un' },

    loteCodigo: { type: String, trim: true },
    fechaVencimiento: { type: Date },

    costoUnitario: { type: Number, min: 0 },

    referenciaTipo: { type: String, trim: true }, // 'OrdenCompra' | 'Venta' | ...
    referenciaId: { type: mongoose.Schema.Types.ObjectId },

    notas: { type: String, trim: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
  },
  { timestamps: true }
);

movimientoStockSchema.index({ createdAt: -1 });
movimientoStockSchema.index({ referenciaTipo: 1, referenciaId: 1 });

export default mongoose.model('MovimientoStock', movimientoStockSchema);

