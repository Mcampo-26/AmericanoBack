import mongoose from 'mongoose';

const inventarioSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidadDisponible: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Inventario', inventarioSchema);
