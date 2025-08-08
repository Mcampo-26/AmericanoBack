import Roles from "../../Models/Roles/index.js";

// Crear o actualizar permisos para un rol existente
export const createOrUpdateRolePermissions = async (req, res) => {
  const { name, empresaId, permisos } = req.body;

  try {
    // Verificar si el rol ya existe
    let role = await Roles.findOne({ name, empresa: empresaId });

    if (role) {
      // Si el rol ya existe, actualizamos los permisos
      role.permisos = permisos;
      await role.save();
      res.status(200).json({ message: "Permisos del rol actualizados con éxito", role });
    } else {
      // Si no existe, creamos un nuevo rol con permisos
      role = new Roles({
        name,
        empresa: empresaId,
        permisos: permisos || {},
      });

      await role.save();
      res.status(200).json({ message: "Rol y permisos creados exitosamente", role });
    }
  } catch (error) {
    console.error("Error al crear o actualizar el rol y permisos:", error);
    res.status(500).json({ message: "Error al crear o actualizar el rol y permisos", error });
  }
};

// Obtener los permisos de un rol por ID
export const getRolePermissions = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Roles.findById(id).select('name permisos'); // <- seleccionamos ambos

    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Devuelve ambos
    res.status(200).json({
      name: role.name,
      permissions: role.permisos || {},
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los permisos", error });
  }
};


export const updateRolePermissions = async (req, res) => {
    const { id } = req.params;
    const { permisos } = req.body;
  
    try {
      const role = await Roles.findById(id);  // Buscar el rol por ID
      
      if (!role) {
        return res.status(404).json({ message: 'Rol no encontrado' });
      }
  
      // Actualizar los permisos
      role.permisos = permisos;
      await role.save();
  
      res.status(200).json({ message: 'Permisos del rol actualizados con éxito', role });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar los permisos", error });
    }
  };

// Eliminar un rol por ID
export const deleteRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Roles.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    res.status(200).json({ message: "Rol y permisos eliminados con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el rol y permisos", error });
  }
};
