// models/UnidadDeMedida.js
import mongoose from "mongoose";

const unidadSchema = new mongoose.Schema({
  nombreUnidad: { type: String, required: true }
});

const UnidadDeMedida = mongoose.model("UnidadDeMedida", unidadSchema);
export default UnidadDeMedida;
