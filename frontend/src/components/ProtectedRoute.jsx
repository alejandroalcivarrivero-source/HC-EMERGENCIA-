import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.rol_id;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Si el rol no está permitido, redirigir a su home correspondiente
      if (userRole === 5 || userRole === 6) { // Administrador o Soporte TI
        return <Navigate to="/admin/usuarios" replace />;
      } else { // Médicos y otros roles operativos
        return <Navigate to="/dashboard" replace />;
      }
    }

    return children;
  } catch (error) {
    console.error('Error decodificando token en ProtectedRoute:', error);
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
