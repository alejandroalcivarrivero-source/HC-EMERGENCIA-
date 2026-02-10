import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Fingerprint, 
    Mail, 
    ShieldCheck, 
    AlertCircle, 
    ChevronLeft, 
    KeyRound, 
    CheckCircle2,
    Lock,
    ArrowRight,
    Smartphone
} from 'lucide-react';

export default function RecuperarForm() {
    const [step, setStep] = useState(1); // 1: Seleccionar Método, 2: Firma, 3: Correo/OTP, 4: OTP Input, 5: Nueva Clave
    const [metodo, setMetodo] = useState(null);
    const [tipoCorreo, setTipoCorreo] = useState('institucional'); // 'institucional' | 'alternativo'
    const [cedula, setCedula] = useState('');
    const [passwordFirma, setPasswordFirma] = useState('');
    const [fileP12, setFileP12] = useState(null);
    const [tokenOtp, setTokenOtp] = useState('');
    const [otp, setOtp] = useState('');
    const [nuevaClave, setNuevaClave] = useState('');
    const [confirmarClave, setConfirmarClave] = useState('');
    const [showNuevaClave, setShowNuevaClave] = useState(false);
    const [showConfirmarClave, setShowConfirmarClave] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [formCorreoAlternativo, setFormCorreoAlternativo] = useState('');
    
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const API_URL = 'http://localhost:3001'; // Ajustar según entorno

    const handleMetodoSeleccionado = (m) => {
        setMetodo(m);
        setStep(m === 'FIRMA' ? 2 : 3);
        setError(null);
    };

    const handleBack = () => {
        if (step === 1) navigate('/');
        else if (step === 2 || step === 3) setStep(1);
        else if (step === 4) setStep(3);
        else if (step === 5) setStep(metodo === 'FIRMA' ? 2 : 4);
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
            const res = await axios.post(`${API_URL}/auth/validar-firma-recuperacion`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStep(5);
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

        // Validaciones previas
        if (!cedula) {
            setError('Por favor ingrese su número de cédula.');
            setLoading(false);
            return;
        }

        if (!/^\d+$/.test(cedula)) {
            setError('La cédula debe contener solo números.');
            setLoading(false);
            return;
        }

        if (cedula.length !== 10) {
            setError('La cédula debe tener 10 dígitos.');
            setLoading(false);
            return;
        }

        try {
            // Construir el correo a validar según el tipo seleccionado
            const correoAValidar = tipoCorreo === 'institucional'
                ? `${cedula}@13d07.mspz4.gob.ec`
                : formCorreoAlternativo;

            // Ajustado para enviar 'destino' en lugar de 'tipo_correo' y 'correo'.
            // El backend ahora resuelve el correo dinámicamente.
            const res = await axios.post(`${API_URL}/auth/solicitar-otp`, {
                cedula,
                destino: tipoCorreo, // 'institucional' o 'alternativo'
            });
            setTokenOtp(res.data.token_otp);
            setStep(4);
            setMensaje(`Se ha enviado un código a su correo ${tipoCorreo}.`);
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
            await axios.post(`${API_URL}/auth/validar-otp-recuperacion`, {
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
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/auth/reset-password-final`, {
                cedula,
                nuevaClave
            });
            setMensaje('Contraseña actualizada con éxito. Redirigiendo al login...');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-xl">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <img src="/SIGEMECH_LOGO.png" alt="Logo" className="h-16 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Recuperar Acceso</h1>
                    <p className="text-slate-500 text-sm mt-1">Siga los pasos para restablecer su seguridad</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-500">
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div 
                                key={s} 
                                className={`h-full flex-1 transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-transparent'}`}
                            />
                        ))}
                    </div>

                    <div className="p-8 md:p-12">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-xl animate-shake">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {mensaje && !error && (
                            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 flex items-center gap-3 rounded-r-xl animate-fade-in">
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{mensaje}</p>
                            </div>
                        )}

                        {/* PASO 1: SELECCIONAR MÉTODO */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                    <h2 className="text-lg font-bold text-slate-700">Seleccione un método de validación</h2>
                                    <p className="text-slate-400 text-xs mt-1">Necesitamos confirmar su identidad de forma segura</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleMetodoSeleccionado('FIRMA')}
                                        className="group p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left space-y-4 shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Fingerprint className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm uppercase">Firma Electrónica</h3>
                                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">Validación instantánea con su archivo .p12</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleMetodoSeleccionado('CORREO')}
                                        className="group p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left space-y-4 shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm uppercase">Código OTP</h3>
                                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">Envío de código a correo institucional o alternativo</p>
                                        </div>
                                    </button>
                                </div>

                                <Link to="/" className="flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 text-sm font-bold pt-4 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                    VOLVER AL LOGIN
                                </Link>
                            </div>
                        )}

                        {/* PASO 2: FIRMA ELECTRÓNICA */}
                        {step === 2 && (
                            <form onSubmit={handleFirmaSubmit} className="space-y-6 animate-slide-up">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cédula de Identidad</label>
                                        <input
                                            type="text"
                                            maxLength="10"
                                            value={cedula}
                                            onChange={(e) => setCedula(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                                            placeholder="0000000000"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archivo de Firma (.p12)</label>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer text-center group"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept=".p12"
                                                onChange={(e) => setFileP12(e.target.files[0])}
                                                className="hidden"
                                            />
                                            <Fingerprint className="h-10 w-10 text-slate-300 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                                            <p className="text-sm font-bold text-slate-600">
                                                {fileP12 ? fileP12.name : 'Seleccionar Archivo .p12'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Haga clic para buscar en su equipo</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña de la Firma</label>
                                        <input
                                            type="password"
                                            value={passwordFirma}
                                            onChange={(e) => setPasswordFirma(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={handleBack} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">ATRÁS</button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                        {loading ? 'VALIDANDO...' : 'VALIDAR FIRMA'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* PASO 3: SOLICITAR OTP */}
                        {step === 3 && (
                            <form onSubmit={handleCorreoSubmit} className="space-y-6 animate-slide-up">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cédula de Identidad</label>
                                        <input
                                            type="text"
                                            maxLength="10"
                                            value={cedula}
                                            onChange={(e) => setCedula(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                                            placeholder="0000000000"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setTipoCorreo('institucional')}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                tipoCorreo === 'institucional' 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                        >
                                            <span className="font-black text-[10px] uppercase">Institucional</span>
                                            <span className="text-[9px] font-medium opacity-75">Zimbra</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipoCorreo('alternativo')}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                tipoCorreo === 'alternativo' 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                        >
                                            <span className="font-black text-[10px] uppercase">Alternativo</span>
                                            <span className="text-[9px] font-medium opacity-75">Personal</span>
                                        </button>
                                    </div>

                                    {tipoCorreo === 'institucional' ? (
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                                            <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Destino del Código</p>
                                                <p className="text-sm font-black text-blue-900 truncate">
                                                    {cedula ? `${cedula}@13d07.mspz4.gob.ec` : 'cedula@13d07.mspz4.gob.ec'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 animate-fade-in">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Correo Alternativo</label>
                                            <input
                                                type="email"
                                                value={formCorreoAlternativo}
                                                onChange={(e) => setFormCorreoAlternativo(e.target.value)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="ejemplo@gmail.com"
                                                required={tipoCorreo === 'alternativo'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={handleBack} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">ATRÁS</button>
                                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                        {loading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* PASO 4: INGRESAR OTP */}
                        {step === 4 && (
                            <form onSubmit={handleOtpSubmit} className="space-y-8 animate-slide-up py-4">
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Verificación OTP</h3>
                                    <p className="text-slate-400 text-xs">Ingrese el código de 6 dígitos enviado a su correo</p>
                                </div>
                                <div className="max-w-xs mx-auto">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full p-4 text-center text-4xl font-black tracking-[0.5em] border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                        {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                                    </button>
                                    <button type="button" onClick={() => setStep(3)} className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest text-center">Reenviar código</button>
                                </div>
                            </form>
                        )}

                        {/* PASO 5: NUEVA CLAVE */}
                        {step === 5 && (
                            <form onSubmit={handleResetPassword} className="space-y-6 animate-slide-up">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nueva Seguridad</h3>
                                    <p className="text-slate-500 text-xs mt-1">Defina su nueva contraseña de acceso</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nueva Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showNuevaClave ? 'text' : 'password'}
                                                value={nuevaClave}
                                                onChange={(e) => setNuevaClave(e.target.value)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowNuevaClave(!showNuevaClave)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                                {showNuevaClave ? 'Ocultar' : 'Ver'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmarClave ? 'text' : 'password'}
                                                value={confirmarClave}
                                                onChange={(e) => setConfirmarClave(e.target.value)}
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowConfirmarClave(!showConfirmarClave)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                                {showConfirmarClave ? 'Ocultar' : 'Ver'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <h4 className="text-[10px] font-black text-amber-800 uppercase mb-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Requisitos de Clave
                                        </h4>
                                        <ul className="text-[10px] text-amber-700 space-y-1 font-medium italic">
                                            <li>• Mínimo 8 caracteres</li>
                                            <li>• Al menos una mayúscula y un número</li>
                                        </ul>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                                    {loading ? 'GUARDANDO...' : 'ACTUALIZAR CONTRASEÑA'}
                                    <ShieldCheck className="h-5 w-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs mt-8 font-medium">
                    SIGEMECH © 2026 - Sistema de Gestión de Emergencias
                </p>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
                .animate-slide-up { animation: slide-up 0.5s ease-out; }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}} />
        </div>
    );
}
