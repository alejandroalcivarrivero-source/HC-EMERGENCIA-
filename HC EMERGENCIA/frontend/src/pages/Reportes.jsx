import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReportesEnfermeria from './ReportesEnfermeria';

export default function Reportes() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Redirigir según el rol
      if (payload.rol_id === 3 || payload.rol_id === 5) {
        // Enfermero o Administrador: mostrar Reportes de Producción
        // No redirigir, mostrar el componente directamente
      } else {
        // Otros roles: mostrar página de reportes generales (si existe)
        // Por ahora, redirigir al dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al decodificar token:', error);
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate]);

  return (
    <div>
      <ReportesEnfermeria />
    </div>
  );
}