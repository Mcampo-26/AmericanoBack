import Usuario from "../Models/Usuario/index.js";

export const cargarUsuarioConPermisos = async (req, res, next) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ message: "No autenticado." });

    const u = await Usuario.findById(id)
      .populate("role", "name permisos")
      .lean();

    if (!u) return res.status(401).json({ message: "Usuario no encontrado." });

    req.authUser = u; // ahora las rutas pueden leer permisos desde acá
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error cargando usuario." });
  }
};
