import mongoose from "mongoose";

const tipoProductoSchema = new mongoose.Schema({
  nombreTipo: { type: String, required: true, unique: true },
});

const TipoProducto = mongoose.model("TipoProducto", tipoProductoSchema);
export default TipoProducto;