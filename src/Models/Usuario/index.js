import { Schema, model } from "mongoose";

const UsuarioSchema = new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: { type: String, default: "" },

  // Relación con rol
  role: { type: Schema.Types.ObjectId, ref: 'Role', default: null },

  // Permisos adicionales (opcional)
  permisos: [{ type: String }], // ejemplo: ["ver_ordenes", "editar_recetas"]

  // Seguridad
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  // Verificación por correo
  verificationCode: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  lastVerificationCodeSentAt: { type: Date, default: null },

  // Estado del usuario
  estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },

}, {
  timestamps: { createdAt: 'creadoEl', updatedAt: 'actualizadoEl' }
});

export default model("Usuario", UsuarioSchema);
