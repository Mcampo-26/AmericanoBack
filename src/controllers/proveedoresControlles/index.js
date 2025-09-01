// controllers/proveedoresControlles/index.js
import Proveedores from "../../Models/Proveedores/index.js";

// helper: garantiza contactos[]
const toArrayContactos = (docOrBody = {}) => {
  // si viene "contactos" bien formados
  if (Array.isArray(docOrBody.contactos) && docOrBody.contactos.length)
    return docOrBody.contactos;

  // si viene el legado "contacto"
  if (docOrBody.contacto && (docOrBody.contacto.telefono || docOrBody.contacto.email || docOrBody.contacto.direccion))
    return [docOrBody.contacto];

  // si no hay nada, devolvemos una fila vacía para el form
  return [{ telefono: "", email: "", direccion: "" }];
};

// Crear
export const crearProveedor = async (req, res) => {
  try {
    const body = { ...req.body };
    body.contactos = toArrayContactos(body);
    delete body.contacto; // ✅ siempre array
    const nuevo = await Proveedores.create(body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar
export const obtenerProveedores = async (_req, res) => {
  try {
    const proveedores = await Proveedores.find().lean();
    // normalizamos para el front
    const data = proveedores.map(p => ({
      ...p,
      contactos: toArrayContactos(p),
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener uno
export const obtenerProveedorPorId = async (req, res) => {
  try {
    const p = await Proveedores.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: "Proveedor no encontrado" });
    p.contactos = toArrayContactos(p);
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
export const actualizarProveedor = async (req, res) => {
  try {
    const body = { ...req.body };
    body.contactos = toArrayContactos(body);
    delete body.contacto;
    const actualizado = await Proveedores.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true }
    ).lean();
    actualizado.contactos = toArrayContactos(actualizado);
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar
export const eliminarProveedor = async (req, res) => {
  try {
    const eliminado = await Proveedores.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
