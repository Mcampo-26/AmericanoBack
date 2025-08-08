import Roles from "../../Models/Roles/index.js";

// Crear un nuevo rol
export const createRole = async (req, res) => {
    try {
      const { name, permisos = {}, estado = "activo" } = req.body;
  
      const existing = await Roles.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: "Ese rol ya existe" });
      }
  
      // ⚠️ asegurarse que permisos sea un objeto
      const defaultPermisos = {
        viewHome: false,
        viewResultadoProduccion: false,
        viewRoles: false,
        viewOrdenes: false,
        viewUnidades: false,
        viewInventario: false,
        viewProduccion: false,
        viewUsuarios: false,
        viewProveedores: false,
        viewProductos: false,
        viewEstados: false,
        viewReportes: false,
        viewClientes: false,
        viewConfiguracion: false,
        ...permisos, // sobrescribe si se pasa algo desde el frontend
      };
  
      const newRole = new Roles({ name, permisos: defaultPermisos, estado });
      await newRole.save();
  
      res.status(201).json(newRole);
    } catch (error) {
      console.error("❌ Error al crear rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
  

export const getAllRoles = async (req, res) => {
    try {
      const roles = await Roles.find(); // sin filtros
      res.status(200).json(roles);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ message: "Error al obtener roles" });
    }
  };
// Obtener un rol por ID
export const getRoleById = async (req, res) => {
  try {
    const role = await Roles.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Rol no encontrado" });

    res.status(200).json(role);
  } catch (error) {
    console.error("Error al obtener rol:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un rol
export const updateRole = async (req, res) => {
  try {
    const { name, permisos, estado } = req.body;

    const updated = await Roles.findByIdAndUpdate(
      req.params.id,
      { name, permisos, estado },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Rol no encontrado" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un rol
export const deleteRole = async (req, res) => {
  try {
    const deleted = await Roles.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Rol no encontrado" });

    res.status(200).json({ message: "Rol eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
