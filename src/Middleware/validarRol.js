export const validarRol = (...rolesPermitidos) => (req, res, next) => {
    const rol = typeof req.user.role === 'string'
      ? req.user.role
      : req.user.role?.name;
  
    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: "Acceso denegado: Rol insuficiente." });
    }
  
    next();
  };
  