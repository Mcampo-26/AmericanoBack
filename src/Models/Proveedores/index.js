import mongoose from "mongoose";

// 🔹 Subdoc: datos de contacto
const contactoSchema = new mongoose.Schema({
  telefono: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, default: "" },
  direccion: { type: String, trim: true, default: "" },
}, { _id: false });

// 🔹 Subdoc: info comercial
const comercialSchema = new mongoose.Schema({
  cuit: { type: String, trim: true, default: "" },
  razonSocial: { type: String, required: true, trim: true },
  condicionIVA: { 
    type: String, 
    enum: ["Responsable Inscripto","Monotributista","Consumidor Final","Exento"], 
    default: "Consumidor Final" 
  },
}, { _id: false });

// 🔹 Subdoc: performance/proveedores
const evaluacionSchema = new mongoose.Schema({
  ponderacionLogistica: { type: Number, default: 0 },   // rapidez de entrega
  calidadProductos: { type: Number, default: 0 },       // calificación interna
  puntualidad: { type: Number, default: 0 },            // %
}, { _id: false });

// 🔹 Esquema principal
const proveedorSchema = new mongoose.Schema({
  comercial: comercialSchema,
  contacto: contactoSchema,
  evaluacion: evaluacionSchema,

  activo: { type: Boolean, default: true },
}, { timestamps: true });

proveedorSchema.index({ "comercial.razonSocial": 1 }, { unique: true, partialFilterExpression: { activo: true } });
proveedorSchema.index({ "comercial.cuit": 1 }, { unique: true, sparse: true });

const Proveedor = mongoose.models.Proveedor || mongoose.model("Proveedor", proveedorSchema);
export default Proveedor;
