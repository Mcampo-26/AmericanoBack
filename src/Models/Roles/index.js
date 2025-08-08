import mongoose from 'mongoose';

// Subdocumento de permisos
const permisosSchema = new mongoose.Schema({
  viewHome: { type: Boolean, default: false },
  viewResultadoProduccion: { type: Boolean, default: false },
  viewRoles: { type: Boolean, default: false },
  viewOrdenes: { type: Boolean, default: false },
  viewUnidades: { type: Boolean, default: false },
  viewInventario: { type: Boolean, default: false },
  viewProduccion: { type: Boolean, default: false },

  // Nuevos campos de permisos
  viewUsuarios: { type: Boolean, default: false },
  viewProveedores: { type: Boolean, default: false },
  viewProductos: { type: Boolean, default: false },
  viewEstados: { type: Boolean, default: false },
  viewReportes: { type: Boolean, default: false },
  viewClientes: { type: Boolean, default: false },
  viewReceta: { type: Boolean, default: false },
  viewConfiguracion: { type: Boolean, default: false },
}, { _id: false });


// Esquema del rol
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empresa: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: false },
  permisos: permisosSchema,
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
