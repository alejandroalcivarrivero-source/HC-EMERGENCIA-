import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FirmaElectronica from '../components/FirmaElectronica';
import { ArrowLeft } from 'lucide-react';

const FirmarAtencionPage = () => {
  const { atencionId } = useParams();
  const navigate = useNavigate();
  const [atencion, setAtencion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAtencion();
  }, [atencionId]);

  const cargarAtencion = async () => {
    try {
      const token = localStorage.getItem('token');
      // Necesitamos obtener la admisionId desde la atención
      const response = await axios.get(
        `http://localhost:3001/api/atencion-emergencia/${atencionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAtencion(response.data);
    } catch (error) {
      console.error('Error al cargar atención:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!atencion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Atención no encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Firmar Formulario 008</h1>
        <p className="text-gray-600">
          Atención ID: {atencion.id} - Admisión ID: {atencion.admisionId}
        </p>
      </div>

      <FirmaElectronica atencionId={atencion.id} />
    </div>
  );
};

export default FirmarAtencionPage;
