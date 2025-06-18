import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  esVendibleDirectamente: Boolean,
  esIngredientePotencial: Boolean,
  esDesperdicio: Boolean,
  tipoProducto: { type: mongoose.Schema.Types.ObjectId, ref: "TipoProducto" }
});

const Producto = mongoose.model("Producto", productoSchema);
export default Producto;