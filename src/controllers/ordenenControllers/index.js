import OrdenDeCompra from '../../Models/Ordenes/index.js';
import EstadoOrden from '../../Models/Ordenes/estado.js';
import Proveedor from '../../Models/Proveedores/index.js'; // 👈 importa tu modelo real

const sanitizeItems = (items = []) =>
  (items || [])
    .filter(it =>
      it?.producto && it?.unidadMedida &&
      Number(it?.cantidadSolicitada) > 0 &&
      Number(it?.precioUnitarioAcordado) >= 0
    )
    .map(it => ({
      producto: String(it.producto),
      unidadMedida: String(it.unidadMedida),
      cantidadSolicitada: Number(it.cantidadSolicitada),
      precioUnitarioAcordado: Number(it.precioUnitarioAcordado),
    }));

// elige un contacto "principal" del proveedor
const pickContacto = (prov) => {
  const arr = Array.isArray(prov?.contactos) ? prov.contactos : [];
  const c = arr.find(x => x?.telefono || x?.direccion || x?.email) || arr[0] || {};
  return {
    telefono: String(c.telefono || ''),
    responsable: String(c.nombre || prov?.comercial?.razonSocial || ''),
    direccion: String(c.direccion || ''),
  };
};

// === Crear ===
export const crearOrden = async (req, res) => {
  try {
    const { proveedor, domicilioEntrega, fechaEntregaEstimada, observaciones = "", estado, items = [] } = req.body;
    const cleanItems = sanitizeItems(items);
    if (!proveedor) return res.status(400).json({ error: "Proveedor requerido" });
    if (!cleanItems.length) return res.status(400).json({ error: "Debe incluir al menos un ítem válido" });

    // default "pendiente"
    let estadoId = estado;
    if (!estadoId) {
      const pend = await EstadoOrden.findOne({ estado: /pendiente/i }).select("_id");
      if (!pend) return res.status(400).json({ error: "No existe el estado 'pendiente'." });
      estadoId = pend._id;
    }

    const prov = await Proveedor.findById(proveedor).select("comercial.razonSocial contactos");
    if (!prov) return res.status(400).json({ error: "Proveedor inválido" });
    const c = pickContacto(prov);

    const doc = await OrdenDeCompra.create({
      proveedor,
      domicilioEntrega: domicilioEntrega || c.direccion,
      telefonoProveedor: c.telefono,
      responsableProveedor: c.responsable,
      fechaEntregaEstimada,
      observaciones,
      estado: estadoId,
      items: cleanItems,
    });

    const populated = await doc.populate([
      { path: "proveedor", select: "comercial.razonSocial contactos" },
      { path: "estado", select: "estado", model: "EstadoOrden" },           // ✅
      { path: "items.producto", select: "nombre" },
      { path: "items.unidadMedida", select: "nombreUnidad", model: "UnidadDeMedida" }, // ✅
    ]);

    res.status(201).json(populated);
  } catch (e) {
    console.error("❌ crearOrden:", e);
    res.status(400).json({ error: e.message });
  }
};

export const obtenerOrdenes = async (_req, res) => {
  try {
    const ordenes = await OrdenDeCompra.find()
      .sort({ createdAt: -1 })
      .populate({ path: "proveedor", select: "comercial.razonSocial contactos" })
      .populate({ path: "estado", select: "estado", model: "EstadoOrden" })                  // ✅
      .populate({ path: "items.producto", select: "nombre" })
      .populate({ path: "items.unidadMedida", select: "nombreUnidad", model: "UnidadDeMedida" }); // ✅

    res.json(ordenes);
  } catch (e) {
    console.error("❌ obtenerOrdenes:", e);
    res.status(500).json({ error: e.message });
  }
};

export const obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await OrdenDeCompra.findById(req.params.id)
      .populate({ path: "proveedor", select: "comercial.razonSocial contactos" })
      .populate({ path: "estado", select: "estado", model: "EstadoOrden" })                  // ✅
      .populate({ path: "items.producto", select: "nombre" })
      .populate({ path: "items.unidadMedida", select: "nombreUnidad", model: "UnidadDeMedida" }); // ✅

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });
    res.json(orden);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// === Update ===
export const actualizarOrden = async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.items)) body.items = sanitizeItems(body.items);

    // si cambió el proveedor o pedís refrescar, recomputamos campos derivados
    if (body.proveedor) {
      const prov = await Proveedor.findById(body.proveedor).select('comercial.razonSocial contactos');
      if (prov) {
        const c = pickContacto(prov);
        if (body.telefonoProveedor === undefined) body.telefonoProveedor = c.telefono;
        if (body.responsableProveedor === undefined) body.responsableProveedor = c.responsable;
        if (!body.domicilioEntrega) body.domicilioEntrega = c.direccion;
      }
    }

    const ordenActualizada = await OrdenDeCompra.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true, context: 'query' }
    )
      .populate({ path: 'proveedor', select: 'comercial.razonSocial contactos' })
      .populate({ path: 'estado', select: 'estado' })
      .populate({ path: 'items.producto', select: 'nombre' })
      .populate({ path: 'items.unidadMedida', select: 'nombreUnidad' });

    if (!ordenActualizada) return res.status(404).json({ error: 'No encontrada' });
    res.json(ordenActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// === Delete ===
export const eliminarOrden = async (req, res) => {
  try {
    const eliminada = await OrdenDeCompra.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ error: "No encontrada" });
    res.json({ mensaje: "Orden eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
