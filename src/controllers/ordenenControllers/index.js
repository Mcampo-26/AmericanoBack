import OrdenDeCompra from '../../Models/Ordenes/index.js'; // asumimos que tenés una carpeta con index.js


// Crear una nueva orden
export const crearOrden = async (req, res) => {
  try {
    const nuevaOrden = new OrdenDeCompra(req.body);
    await nuevaOrden.save();
    res.status(201).json(nuevaOrden);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener todas las órdenes
export const obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenDeCompra.find()
  .populate("proveedor", "razonSocial")
  .populate("estado", "estado")
  .populate("items.producto", "nombre")
  .populate("items.unidadMedida", "nombreUnidad");

    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una orden por ID
export const obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await OrdenDeCompra.findById(req.params.id)
      .populate("proveedor")
      .populate("estado")
      .populate("items.producto")
      .populate("items.unidadMedida");

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una orden (ej: estado o ítems)
export const actualizarOrden = async (req, res) => {
  try {
    const ordenActualizada = await OrdenDeCompra.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(ordenActualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar una orden
export const eliminarOrden = async (req, res) => {
  try {
    const eliminada = await OrdenDeCompra.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ error: "No encontrada" });

    res.json({ mensaje: "Orden eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
