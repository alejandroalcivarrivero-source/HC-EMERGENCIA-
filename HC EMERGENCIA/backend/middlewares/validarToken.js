const jwt = require('jsonwebtoken');

const validarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Validando token. Token recibido:', token ? 'Sí' : 'No'); // Log para depuración

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Asumiendo que el payload del token tiene un 'id'
    req.rolId = decoded.rol_id; // Extraer el rol_id del token
    console.log('Token verificado. Usuario ID:', req.userId, 'Rol ID:', req.rolId); // Log para depuración
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = validarToken;