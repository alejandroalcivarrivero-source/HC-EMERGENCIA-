const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ mensaje: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.rol_id !== 5) {
      return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};
