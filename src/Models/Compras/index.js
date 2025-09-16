// src/Models/Compras/index.js
import mongoose, { Schema, Types } from "mongoose";

const ItemSchema = new Schema(
  {
    producto: { type: Types.ObjectId, ref: "Producto", required: true },
    cantidadSolicitada: { type: Number, required: true, min: 0 },
    precioUnitarioAcordado: { type: Number, required: true, min: 0 },
    unidadMedida: { type: Types.ObjectId, ref: "UnidadDeMedida", required: true },
  },
  { _id: false }
);

const CompraSchema = new Schema(
  {
    proveedor: { type: Types.ObjectId, ref: "Proveedor", required: true },
    fechaCompra: { type: Date, default: Date.now },
    fechaEntregaEstimada: { type: Date },
    observaciones: { type: String, default: "" },

    items: [ItemSchema],

    // 👇 NOMBRE DE MODELO CORRECTO
    estado: { type: Types.ObjectId, ref: "EstadoOrden", required: true },

    // id de la orden origen (opcional, para borrar/traquear)
    origenOrden: { type: Types.ObjectId, ref: "OrdenDeCompra" },
  },
  { timestamps: true }
);

// evitar “OverwriteModelError” en hot-reload
export default mongoose.models.Compra || mongoose.model("Compra", CompraSchema);
