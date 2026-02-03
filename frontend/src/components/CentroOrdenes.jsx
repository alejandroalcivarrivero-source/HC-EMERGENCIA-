import React, { useState } from 'react';
import { ClipboardList, FlaskConical, Image as ImageIcon, FileText, Send } from 'lucide-react';
import RecetaMedicaForm from './RecetaMedicaForm';
import OrdenExamenForm from './OrdenExamenForm';
import OrdenImagenForm from './OrdenImagenForm';
import ReferenciaForm from './ReferenciaForm';

const CentroOrdenes = ({ admisionId, pacienteId, atencionId, showReferencia = false }) => {
  const [showReceta, setShowReceta] = useState(false);
  const [showExamen, setShowExamen] = useState(false);
  const [showImagen, setShowImagen] = useState(false);
  const [showReferenciaModal, setShowReferenciaModal] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
        <ClipboardList className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Centro de Órdenes</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setShowReceta(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors group"
        >
          <FileText className="w-6 h-6 text-orange-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-orange-800">Receta</span>
        </button>

        <button
          onClick={() => setShowExamen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-50 border border-cyan-100 hover:bg-cyan-100 transition-colors group"
        >
          <FlaskConical className="w-6 h-6 text-cyan-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-cyan-800">Laboratorio (010)</span>
        </button>

        <button
          onClick={() => setShowImagen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors group"
        >
          <ImageIcon className="w-6 h-6 text-violet-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-violet-800">Imagen (012)</span>
        </button>

        {showReferencia && (
          <button
            onClick={() => setShowReferenciaModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group"
          >
            <Send className="w-6 h-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-emerald-800">Referencia (053)</span>
          </button>
        )}
      </div>

      {/* Modales - Secciones Rápidas */}
      {atencionId && (
        <>
          {showReceta && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <RecetaMedicaForm
                  admisionId={admisionId}
                  atencionId={atencionId}
                  onClose={() => setShowReceta(false)}
                />
              </div>
            </div>
          )}

          {showExamen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <OrdenExamenForm
                  admisionId={admisionId}
                  atencionId={atencionId}
                  onClose={() => setShowExamen(false)}
                />
              </div>
            </div>
          )}

          {showImagen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <OrdenImagenForm
                  admisionId={admisionId}
                  atencionId={atencionId}
                  onClose={() => setShowImagen(false)}
                />
              </div>
            </div>
          )}

          {showReferenciaModal && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <ReferenciaForm
                  admisionId={admisionId}
                  atencionId={atencionId}
                  onClose={() => setShowReferenciaModal(false)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CentroOrdenes;
