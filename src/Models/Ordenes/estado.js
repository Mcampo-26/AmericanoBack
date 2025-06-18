import mongoose from "mongoose";

const estadoOrdenSchema = new mongoose.Schema({
  estado: { type: String, required: true, unique: true }
});

const EstadoOrdenDeCompra = mongoose.model("EstadoOrdenDeCompra", estadoOrdenSchema);
export default EstadoOrdenDeCompra;
