export const validarPermiso = (permiso) => (req, res, next) => {
    const roleName = req.authUser?.role?.name;
    const permisos = req.authUser?.role?.permisos || {};
  
    // Si es admin, pasa directo
    if (roleName === "Admin") return next();
  
    // Si tiene el permiso específico, pasa
    if (permisos[permiso] === true) return next();
  
    // Si no, error
    return res.status(403).json({ message: "Acceso denegado: permiso insuficiente." });
  };
  