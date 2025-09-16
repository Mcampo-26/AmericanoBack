// controllers/compraController.js
import Compra from "../../Models/Compras/index.js";
import OrdenDeCompra from "../../Models/Ordenes/index.js";        // ✅ importar la orden
import EstadoOrden from "../../Models/Ordenes/estado.js";         // ✅ el modelo se llama EstadoOrden

const sanitizeItems = (items = []) =>
  (items || [])
    .filter(
      (it) =>
        it?.producto &&
        it?.unidadMedida &&
        Number(it?.cantidadSolicitada) > 0 &&
        Number(it?.precioUnitarioAcordado) >= 0
    )
    .map((it) => ({
      producto: String(it.producto),
      unidadMedida: String(it.unidadMedida),
      cantidadSolicitada: Number(it.cantidadSolicitada),
      precioUnitarioAcordado: Number(it.precioUnitarioAcordado),
    }));

// Crear una nueva compra
export const crearCompra = async (req, res) => {
  try {
    const {
      proveedor,
      fechaEntregaEstimada,
      observaciones = "",
      items = [],
      estado,            // puede venir _id (opcional)
      origenOrden,       // id de la orden que se transforma (opcional)
    } = req.body;

    const cleanItems = sanitizeItems(items);
    if (!proveedor) return res.status(400).json({ error: "Proveedor requerido" });
    if (!cleanItems.length) return res.status(400).json({ error: "Items inválidos" });

    // Estado por defecto = "finalizado" si no vino
    let estadoId = estado;
    if (!estadoId) {
      const fin = await EstadoOrden.findOne({ estado: /final/i }).select("_id");
      estadoId = fin?._id || undefined;
    }

    const compra = await Compra.create({
      proveedor,
      fechaEntregaEstimada,
      observaciones,
      items: cleanItems,
      estado: estadoId,
      origenOrden,
    });

    // Si vino una orden de origen, la eliminamos
    if (origenOrden) {
      await OrdenDeCompra.findByIdAndDelete(origenOrden);
    }

    const populated = await compra.populate([
      { path: "proveedor", select: "comercial.razonSocial" },
      { path: "estado", select: "estado" },
      { path: "items.producto", select: "nombre" },
      { path: "items.unidadMedida", select: "nombreUnidad" },
    ]);

    return res.status(201).json(populated);
  } catch (err) {
    console.error("❌ crearCompra:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const obtenerCompras = async (_req, res) => {
  try {
    const compras = await Compra.find()
      .populate("proveedor", "comercial.razonSocial")
      .populate("estado", "estado")
      .populate("items.producto", "nombre")
      .populate("items.unidadMedida", "nombreUnidad");
    res.json(compras);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompraPorId = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate("proveedor")
      .populate("estado")
      .populate("items.producto")
      .populate("items.unidadMedida");
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });
    res.json(compra);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const eliminarCompra = async (req, res) => {
  try {
    const compra = await Compra.findByIdAndDelete(req.params.id);
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });
    res.json({ mensaje: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar compra:", error);
    res.status(500).json({ error: error.message });
  }
};
