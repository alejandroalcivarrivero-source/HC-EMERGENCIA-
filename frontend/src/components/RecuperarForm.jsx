import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RecuperarForm() {
    const [step, setStep] = useState(1); // 1: Seleccionar Método, 2: Firma, 3: Correo, 4: OTP, 5: Nueva Clave
    const [metodo, setMetodo] = useState(null);
    const [cedula, setCedula] = useState('');
    const [passwordFirma, setPasswordFirma] = useState('');
    const [fileP12, setFileP12] = useState(null);
    const [tokenOtp, setTokenOtp] = useState('');
    const [otp, setOtp] = useState('');
    const [nuevaClave, setNuevaClave] = useState('');
    const [confirmarClave, setConfirmarClave] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const handleMetodoSeleccionado = (m) => {
        setMetodo(m);
        setStep(m === 'FIRMA' ? 2 : 3);
        setError(null);
    };

    const handleBack = () => {
        setStep(1);
        setMetodo(null);
        setError(null);
    };

    const handleFirmaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!fileP12) {
            setError('Por favor, cargue su archivo .p12');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('cedula', cedula);
        formData.append('archivo_p12', fileP12);
        formData.append('password_firma', passwordFirma);

        try {
            const res = await axios.post('http://190.214.55.52:3001/auth/validar-firma-recuperacion', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStep(5); // Ir a cambio de contraseña
            setMensaje('Identidad validada con éxito. Ingrese su nueva contraseña.');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al validar la firma');
        } finally {
            setLoading(false);
        }
    };

    const handleCorreoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('http://190.214.55.52:3001/auth/solicitar-otp', {
                cedula,
                correo: `${cedula}@13d07.mspz4.gob.ec` // Asumimos correo institucional basado en cédula según requerimiento
            });
            setTokenOtp(res.data.token_otp);
            setStep(4); // Ir a ingresar OTP
            setMensaje('Se ha enviado un código a su correo institucional.');
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al enviar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('http://190.214.55.52:3001/auth/validar-otp-recuperacion', {
                cedula,
                otp,
                token_otp: tokenOtp
            });
            setStep(5);
            setMensaje('Código verificado. Ingrese su nueva contraseña.');
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto o expirado');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (nuevaClave !== confirmarClave) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            await axios.post('http://190.214.55.52:3001/auth/reset-password-final', {
                cedula,
                nuevaClave
            });
            setMensaje('Contraseña actualizada con éxito. Redirigiendo al login...');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4">
            <div className="bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-md border border-slate-100">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">Recuperación de Cuenta</h2>
                    <p className="text-blue-100 text-sm mt-1">SIGEMECH - Centro de Salud Chone</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {mensaje && (
                        <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
                            <p>{mensaje}</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-center mb-6">Seleccione el método de validación para resetear su clave:</p>
                            <button
                                onClick={() => handleMetodoSeleccionado('FIRMA')}
                                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="text-left">
                                    <span className="block font-bold text-gray-800">Método A: Firma Electrónica</span>
                                    <span className="text-xs text-gray-500">Validación offline instantánea con su .p12</span>
                                </div>
                                <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleMetodoSeleccionado('CORREO')}
                                className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="text-left">
                                    <span className="block font-bold text-gray-800">Método B: Correo Institucional</span>
                                    <span className="text-xs text-gray-500">Envío de código OTP al servidor Zimbra</span>
                                </div>
                                <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleFirmaSubmit} className="space-y-4">
                            <h3 className="font-bold text-gray-700">Validación por Firma Electrónica</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula</label>
                                <input
                                    type="text"
                                    maxLength="10"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Archivo de Firma (.p12)</label>
                                <input
                                    type="file"
                                    accept=".p12"
                                    onChange={(e) => setFileP12(e.target.files[0])}
                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña de la Firma</label>
                                <input
                                    type="password"
                                    value={passwordFirma}
                                    onChange={(e) => setPasswordFirma(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleBack} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Atrás</button>
                                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:bg-blue-300">
                                    {loading ? 'Validando...' : 'Validar Firma'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleCorreoSubmit} className="space-y-4">
                            <h3 className="font-bold text-gray-700">Validación por Correo Institucional</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula</label>
                                <input
                                    type="text"
                                    maxLength="10"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-700">El código se enviará a:</p>
                                <p className="text-sm font-bold text-blue-900">{cedula ? `${cedula}@13d07.mspz4.gob.ec` : 'Su-cedula@13d07.mspz4.gob.ec'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleBack} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Atrás</button>
                                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:bg-blue-300">
                                    {loading ? 'Enviando...' : 'Enviar Código'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 4 && (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <h3 className="font-bold text-gray-700 text-center">Ingrese el Código OTP</h3>
                            <p className="text-xs text-gray-500 text-center">Enviado a su correo Zimbra (190.214.55.52)</p>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-3 text-center text-2xl tracking-[1em] font-bold border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="000000"
                                required
                            />
                            <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold disabled:bg-blue-300">
                                {loading ? 'Verificando...' : 'Verificar Código'}
                            </button>
                            <button type="button" onClick={() => setStep(3)} className="w-full text-xs text-blue-600 font-bold hover:underline">Reenviar código</button>
                        </form>
                    )}

                    {step === 5 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <h3 className="font-bold text-gray-700">Nueva Contraseña</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nueva Clave</label>
                                <input
                                    type="password"
                                    value={nuevaClave}
                                    onChange={(e) => setNuevaClave(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Clave</label>
                                <input
                                    type="password"
                                    value={confirmarClave}
                                    onChange={(e) => setConfirmarClave(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                                Actualizar Contraseña
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Soporte Técnico</h4>
                        <div className="flex gap-2">
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">EXT 1341</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">EXT 1342</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-700">Ing. Sergio Solórzano</p>
                            <a href="tel:0983369608" className="text-[10px] text-blue-600 block">0983369608</a>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-700">Ing. Alejandro Alcívar</p>
                            <a href="tel:0986382910" className="text-[10px] text-blue-600 block">0986382910</a>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
                            &larr; REGRESAR AL LOGIN
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
