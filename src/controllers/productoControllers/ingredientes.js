import { Ingrediente } from "../../Models/Producto/index.js";

// helpers de populate
const populateRefs = [
  { path: "producto", select: "nombre codigo tipoProducto", populate: { path: "tipoProducto", select: "nombreTipo" } },
  { path: "stock.unidadBase", select: "nombreUnidad" },
  { path: "proveedores.proveedorPrincipal", select: "comercial.razonSocial contacto.telefono contacto.email" },
  { path: "proveedores.alternativos", select: "comercial.razonSocial" },
];

// Crear
export const crearIngrediente = async (req, res) => {
  try {
    const doc = await Ingrediente.create(req.body);
    const full = await Ingrediente.findById(doc._id).populate(populateRefs);
    res.status(201).json(full);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Ya existe un ingrediente activo para ese producto." });
    }
    res.status(400).json({ error: err.message });
  }
};

// Listar (solo activos). Soporta ?producto=<id> como filtro opcional
export const obtenerIngredientes = async (req, res) => {
  try {
    const filtro = { activo: true };
    if (req.query.producto) filtro.producto = req.query.producto;

    const lista = await Ingrediente.find(filtro)
      .populate(populateRefs)
      .lean();

    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener por ID
export const obtenerIngredientePorId = async (req, res) => {
  try {
    const ing = await Ingrediente.findById(req.params.id).populate(populateRefs);
    if (!ing || !ing.activo) return res.status(404).json({ error: "Ingrediente no encontrado" });
    res.json(ing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Actualizar
export const actualizarIngrediente = async (req, res) => {
  try {
    const ing = await Ingrediente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(populateRefs);

    if (!ing) return res.status(404).json({ error: "Ingrediente no encontrado" });
    res.json(ing);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Conflicto de unicidad: ya hay un ingrediente activo para ese producto." });
    }
    res.status(400).json({ error: err.message });
  }
};

// Eliminar (borrado lógico)
export const eliminarIngrediente = async (req, res) => {
  try {
    const ing = await Ingrediente.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!ing) return res.status(404).json({ error: "Ingrediente no encontrado" });
    res.json({ ok: true, mensaje: "Ingrediente desactivado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
