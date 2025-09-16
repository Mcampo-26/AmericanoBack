// src/Models/Ordenes/estado.js
import mongoose, { Schema } from "mongoose";

const EstadoOrdenSchema = new Schema(
  { estado: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true }
);

const EstadoOrden =
  mongoose.models.EstadoOrden || mongoose.model("EstadoOrden", EstadoOrdenSchema);

export default EstadoOrden;
