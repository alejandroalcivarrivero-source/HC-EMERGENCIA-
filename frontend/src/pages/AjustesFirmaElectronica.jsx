import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileKey, Upload, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { useSidebar } from '../contexts/SidebarContext';

const API = 'http://localhost:3001/api/firma-electronica';

export default function AjustesFirmaElectronica() {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const [certificado, setCertificado] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState({ tieneCertificado: false, metadatos: null });
  const [metadatosValidados, setMetadatosValidados] = useState(null);
  const [paso, setPaso] = useState('inicio'); // inicio | validando | mostrando | guardando

  useEffect(() => {
    obtenerInfo();
  }, []);

  const obtenerInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/');
      const res = await axios.get(`${API}/certificado/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInfo(res.data);
    } catch (e) {
      setError('No se pudo cargar la información del certificado.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setCertificado(file);
        setError(null);
        setMetadatosValidados(null);
        setPaso('inicio');
      } else {
        setError('Solo se permiten archivos .p12 o .pfx');
        setCertificado(null);
      }
    }
  };

  const validarYMostrarMetadatos = async () => {
    if (!certificado || !password.trim()) {
      setError('Seleccione el archivo .p12 e ingrese la contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    setMetadatosValidados(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('certificado', certificado);
      formData.append('password', password.trim());
      const res = await axios.post(`${API}/validar-p12`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMetadatosValidados(res.data);
      setPaso('mostrando');
    } catch (err) {
      setError(err.response?.data?.message || 'Contraseña incorrecta o archivo .p12 inválido.');
      setPaso('inicio');
    } finally {
      setLoading(false);
    }
  };

  const guardarCertificado = async () => {
    if (!certificado || !password.trim()) {
      setError('Debe validar primero el certificado con su contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('certificado', certificado);
      formData.append('password', password.trim());
      await axios.post(`${API}/guardar-certificado`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setPaso('inicio');
      setCertificado(null);
      setPassword('');
      setMetadatosValidados(null);
      await obtenerInfo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el certificado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <Header />
      <main
        className="py-8 px-4 transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? '256px' : '0' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <FileKey className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Firma Electrónica</h1>
              <p className="text-sm text-gray-500">Certificado .p12 cifrado en el servidor (AES-256). La contraseña no se guarda.</p>
            </div>
          </div>

        {info.tieneCertificado && info.metadatos && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Certificado guardado</span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Nombre:</strong> {info.metadatos.nombre || '—'}</p>
              <p><strong>CI:</strong> {info.metadatos.ci || '—'}</p>
              <p><strong>Entidad emisora:</strong> {info.metadatos.entidadEmisora || '—'}</p>
              <p><strong>Válido hasta:</strong> {info.metadatos.fechaExpiracion || '—'}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Al firmar formularios se le pedirá solo la clave del certificado.</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              {info.tieneCertificado ? 'Reemplazar o cargar certificado' : 'Cargar certificado .p12'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              El archivo se valida con su contraseña (sin guardarla) y luego se almacena cifrado en el servidor.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo .p12</label>
              <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors bg-gray-50/50">
                <Upload className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
                <span className="text-gray-700 font-medium">
                  {certificado ? certificado.name : 'Seleccionar archivo .p12 o .pfx'}
                </span>
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña del certificado</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese la contraseña para extraer metadatos (no se guarda)"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-base bg-white"
              />
            </div>

            {paso === 'inicio' && certificado && (
              <button
                onClick={validarYMostrarMetadatos}
                disabled={loading || !password.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500 font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                {loading ? 'Validando...' : 'Validar y ver metadatos'}
              </button>
            )}

            {paso === 'mostrando' && metadatosValidados && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metadatos del certificado</p>
                  <dl className="text-sm space-y-1">
                    <dt className="text-gray-500">Nombre</dt>
                    <dd className="font-medium text-gray-800">{metadatosValidados.nombre || '—'}</dd>
                    <dt className="text-gray-500 mt-2">CI</dt>
                    <dd className="font-medium text-gray-800">{metadatosValidados.ci || '—'}</dd>
                    <dt className="text-gray-500 mt-2">Entidad emisora</dt>
                    <dd className="font-medium text-gray-800">{metadatosValidados.entidadEmisora || '—'}</dd>
                    <dt className="text-gray-500 mt-2">Fecha de expiración</dt>
                    <dd className="font-medium text-gray-800">{metadatosValidados.fechaExpiracion || '—'}</dd>
                  </dl>
                </div>
                <button
                  onClick={guardarCertificado}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 font-semibold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {loading ? 'Guardando (cifrado AES-256)...' : 'Guardar certificado cifrado'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500">
          Compatible con Linux Mint, Windows y macOS. El certificado se cifra en servidor con AES-256-GCM y su contraseña nunca se almacena (cumplimiento normativo).
        </p>
        </div>
      </main>
    </div>
  );
}
