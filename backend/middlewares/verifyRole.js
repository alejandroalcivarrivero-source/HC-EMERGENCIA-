const verifyRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // Si se pasa un solo rol, lo convertimos a array
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    
    if (!req.rolId) {
      return res.status(403).json({ message: 'No se encontró información de rol.' });
    }

    if (!roles.includes(req.rolId)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. No tienes permisos para realizar esta acción.' 
      });
    }

    next();
  };
};

module.exports = verifyRole;
