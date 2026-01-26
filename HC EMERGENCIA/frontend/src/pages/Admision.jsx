import AdmisionForm from '../components/AdmisionForm';
import Header from '../components/Header';
import { useState } from 'react';

export default function Admision() {
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const fechaAdmision = formatDate(now);
  const horaAdmision = formatTime(now);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <div className="max-w-screen-xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Admisión</h1>
          <div className="mb-4 text-gray-600">
            Fecha: {fechaAdmision} Hora: {horaAdmision}
          </div>
          <AdmisionForm />
        </div>
      </main>
    </div>
  );
}