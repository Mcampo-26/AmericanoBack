import Receta from "../../Models/Receta/index.js";

// 🟢 Crear nueva receta
export const crearReceta = async (req, res) => {
  try {
    const { nombre, descripcion, ingredientes, tiempoProduccion } = req.body; // ⬅️ lo recibimos
    const creadoPor = req.user?.id || null;

    if (!nombre || !ingredientes || ingredientes.length === 0) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    const existe = await Receta.findOne({ nombre });
    if (existe) {
      return res.status(409).json({ message: "Ya existe una receta con ese nombre." });
    }

    const nueva = new Receta({
      nombre,
      descripcion,
      ingredientes,
      tiempoProduccion: Number(tiempoProduccion) || 0, // ⬅️ guardamos minutos
      creadoPor
    });

    await nueva.save();
    res.status(201).json(nueva);

  } catch (error) {
    console.error("❌ Error al crear receta:", error);
    res.status(500).json({ message: "Error interno al crear receta." });
  }
};

// 🟢 Obtener todas las recetas activas
export const obtenerRecetas = async (_req, res) => {
  try {
    const recetas = await Receta.find({ activo: true }).sort({ createdAt: -1 });
    res.status(200).json(recetas);
  } catch (error) {
    console.error("❌ Error al obtener recetas:", error);
    res.status(500).json({ message: "Error al obtener recetas." });
  }
};

// 🟢 Obtener receta por ID
export const obtenerRecetaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const receta = await Receta.findById(id);
    if (!receta) return res.status(404).json({ message: "Receta no encontrada." });
    res.status(200).json(receta);
  } catch (error) {
    console.error("❌ Error al buscar receta:", error);
    res.status(500).json({ message: "Error al buscar receta." });
  }
};

// 🟡 Actualizar receta
export const actualizarReceta = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // normalizar (evita duplicados por espacios/case)
    if (data.nombre) data.nombre = data.nombre.trim();

    // si cambia el nombre, validar contra otros docs
    if (data.nombre) {
      const existe = await Receta.findOne({
        nombre: data.nombre,
        _id: { $ne: id }
      });
      if (existe) {
        return res.status(409).json({ message: 'Ya existe una receta con ese nombre' });
      }
    }

    const receta = await Receta.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!receta) return res.status(404).json({ message: 'No encontrada' });
    res.json(receta);
  } catch (e) {
    console.error('ERROR actualizarReceta:', e);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};

// 🔴 Eliminar receta (lógico)
export const eliminarReceta = async (req, res) => {
  try {
    const { id } = req.params;
    const receta = await Receta.findByIdAndUpdate(id, { activo: false }, { new: true });
    if (!receta) {
      return res.status(404).json({ message: "Receta no encontrada." });
    }
    res.status(200).json({ message: "Receta desactivada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar receta:", error);
    res.status(500).json({ message: "Error al eliminar receta." });
  }
};
