import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';

export default function AdminVideos({ hideHeader = false }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    url_video: '',
    tipo: 'youtube',
    orden: 0,
    activo: true
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [configuracionAudio, setConfiguracionAudio] = useState({
    volumen_videos: 15,
    volumen_llamado: 100,
    volumen_atenuacion: 5
  });
  const [showConfigAudio, setShowConfigAudio] = useState(false);

  useEffect(() => {
    obtenerVideos();
    obtenerConfiguracionAudio();
  }, []);

  const obtenerConfiguracionAudio = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/configuracion-audio', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        setConfiguracionAudio(res.data.configuracion);
      }
    } catch (error) {
      console.error('Error al obtener configuración de audio:', error);
    }
  };

  const guardarConfiguracionAudio = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/api/configuracion-audio',
        configuracionAudio,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Configuración de audio guardada exitosamente');
      setShowConfigAudio(false);
    } catch (error) {
      console.error('Error al guardar configuración de audio:', error);
      alert('Error al guardar configuración: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const obtenerVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/multimedia-tv', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVideos(res.data.videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener videos:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('orden', formData.orden);
      formDataToSend.append('activo', formData.activo);
      
      if (formData.tipo === 'youtube') {
        formDataToSend.append('url_video', formData.url_video);
      } else if (uploadFile) {
        formDataToSend.append('video', uploadFile);
      }

      if (editingVideo) {
        // Actualizar
        await axios.put(
          `http://localhost:3001/api/multimedia-tv/${editingVideo.id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        // Crear
        await axios.post(
          'http://localhost:3001/api/multimedia-tv',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      setShowForm(false);
      setEditingVideo(null);
      setFormData({ titulo: '', url_video: '', tipo: 'youtube', orden: 0, activo: true });
      setUploadFile(null);
      obtenerVideos();
    } catch (error) {
      console.error('Error al guardar video:', error);
      alert('Error al guardar video: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      titulo: video.titulo,
      url_video: video.url_video,
      tipo: video.tipo,
      orden: video.orden,
      activo: video.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este video?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/multimedia-tv/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      obtenerVideos();
    } catch (error) {
      console.error('Error al eliminar video:', error);
      alert('Error al eliminar video: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const toggleActivo = async (video) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/multimedia-tv/${video.id}`,
        { ...video, activo: !video.activo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      obtenerVideos();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newVideos = [...videos];
    const draggedVideo = newVideos[dragIndex];
    newVideos.splice(dragIndex, 1);
    newVideos.splice(dropIndex, 0, draggedVideo);

    // Actualizar órdenes
    const videosToUpdate = newVideos.map((video, index) => ({
      id: video.id,
      orden: index + 1
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3001/api/multimedia-tv/orden/actualizar',
        { videos: videosToUpdate },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      obtenerVideos();
    } catch (error) {
      console.error('Error al actualizar orden:', error);
    }

    setDragIndex(null);
  };

  const obtenerMiniatura = (video) => {
    if (video.tipo === 'youtube') {
      // Extraer ID de YouTube
      const match = video.url_video.match(/([a-zA-Z0-9_-]{11})/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    return '/placeholder-video.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto py-8">
          <p>Cargando videos...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Administración de Videos Educativos</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfigAudio(!showConfigAudio)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              🔊 Configuración de Audio
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingVideo(null);
                setFormData({ titulo: '', url_video: '', tipo: 'youtube', orden: 0, activo: true });
                setUploadFile(null);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancelar' : '+ Agregar Video'}
            </button>
          </div>
        </div>

        {showConfigAudio && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-2 border-purple-200">
            <h3 className="text-xl font-semibold mb-4 text-purple-800">
              🔊 Configuración de Audio de la TV
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen General de Videos: <span className="font-bold text-blue-600">{configuracionAudio.volumen_videos}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={configuracionAudio.volumen_videos}
                  onChange={(e) => setConfiguracionAudio({ ...configuracionAudio, volumen_videos: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Volumen normal de reproducción de videos educativos (Sugerido: 15%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen de Llamado (Voz y Ding-Dong): <span className="font-bold text-green-600">{configuracionAudio.volumen_llamado}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={configuracionAudio.volumen_llamado}
                  onChange={(e) => setConfiguracionAudio({ ...configuracionAudio, volumen_llamado: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Volumen de sonidos de llamado y anuncios de voz (Sugerido: 100%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen de Atenuación durante Anuncios: <span className="font-bold text-orange-600">{configuracionAudio.volumen_atenuacion}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={configuracionAudio.volumen_atenuacion}
                  onChange={(e) => setConfiguracionAudio({ ...configuracionAudio, volumen_atenuacion: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Volumen al que baja el video durante los anuncios de pacientes (Sugerido: 5%)
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={guardarConfiguracionAudio}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Guardar Configuración
                </button>
                <button
                  onClick={() => {
                    setShowConfigAudio(false);
                    obtenerConfiguracionAudio(); // Restaurar valores originales
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingVideo ? 'Editar Video' : 'Nuevo Video'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Video
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="youtube">YouTube</option>
                  <option value="local">Archivo Local (MP4)</option>
                </select>
              </div>

              {formData.tipo === 'youtube' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de YouTube
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.url_video}
                    onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID o https://www.youtube.com/embed/VIDEO_ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puede usar cualquier formato de URL de YouTube, se convertirá automáticamente
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo de Video (MP4, máximo 500MB)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {!editingVideo && (
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadFile ? `Archivo seleccionado: ${uploadFile.name}` : 'Seleccione un archivo de video'}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden de Reproducción
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Menor número = se reproduce primero. Si es 0, se asignará automáticamente.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Activo (aparecerá en la pantalla de TV)
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  {editingVideo ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVideo(null);
                    setFormData({ titulo: '', url_video: '', tipo: 'youtube', orden: 0, activo: true });
                    setUploadFile(null);
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold">Lista de Videos</h3>
            <p className="text-sm text-gray-600">
              Arrastra y suelta para cambiar el orden de reproducción
            </p>
          </div>
          <div className="divide-y">
            {videos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay videos registrados. Agrega uno para comenzar.
              </div>
            ) : (
              videos.map((video, index) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 cursor-move transition ${
                    dragIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="text-gray-400 text-2xl">☰</div>
                  <div className="flex-shrink-0">
                    <img
                      src={obtenerMiniatura(video)}
                      alt={video.titulo}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/placeholder-video.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{video.titulo}</h4>
                    <p className="text-sm text-gray-600">
                      Tipo: {video.tipo === 'youtube' ? 'YouTube' : 'Local'} | 
                      Orden: {video.orden} | 
                      Creado por: {video.usuario?.nombres} {video.usuario?.apellidos}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 break-all">{video.url_video}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActivo(video)}
                      className={`px-3 py-1 rounded text-sm ${
                        video.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {video.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => handleEdit(video)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
