import mongoose from "mongoose";

const proveedoresSchema = new mongoose.Schema({
  razonSocial: { type: String, required: true },
  cuit: String,
  datosContacto: String,
  ponderacionLogistica: Number
});

const Proveedor = mongoose.model("Proveedor", proveedoresSchema); // ← cambio aquí
export default Proveedor;