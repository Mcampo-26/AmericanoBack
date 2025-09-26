// models/LogEvento.js
import mongoose from "mongoose";

const LogEventoSchema = new mongoose.Schema({
  ts: { type: Date, default: Date.now, index: true },       // timestamp
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", index: true },
  sessionId: { type: String, index: true },                  // id de sesión (login->logout)
  action: { type: String, index: true },                     // ej: 'auth.login', 'auth.logout', 'prod.start', 'prod.end', 'ui.heartbeat'
  entity: { type: String },                                  // 'Proceso', 'Receta', 'Compra', 'Producto', etc.
  entityId: { type: String },                                // id de la entidad afectada
  result: { type: String, enum: ['ok','error','info'], default: 'ok', index: true },
  meta: { type: Object, default: {} },                       // detalles (duraciones, cantidades, IP, userAgent, cambios, etc.)
  ip: String,
  userAgent: String
}, { versionKey: false });

LogEventoSchema.index({ userId: 1, ts: -1 });
LogEventoSchema.index({ action: 1, ts: -1 });
// Opcional: retención automática (p. ej. 180 días)
// LogEventoSchema.index({ ts: 1 }, { expireAfterSeconds: 180*24*3600 });

export default mongoose.model("LogEvento", LogEventoSchema);
