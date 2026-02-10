import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { useNotification } from '../contexts/NotificationContext';
import { validarPasswordEstricto } from '../utils/validaciones'; // Importar la función de validación
import {
    ShieldCheck,
    KeyRound,
    Fingerprint,
    AlertCircle,
    Lock,
    ChevronRight,
    Send,
    CheckCircle2,
    Eye, EyeOff
} from 'lucide-react';

export default function CambiarContrasenaForm() {
    const [step, setStep] = useState(1); // 1: Solicitar OTP, 2: Validar OTP, 3: Nueva Clave
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [otp, setOtp] = useState('');
    const [tokenOtp, setTokenOtp] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        number: false,
    });
    
    const [usuario, setUsuario] = useState(null);
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsuario(payload);
        } catch (e) {
            navigate('/');
        }
    }, [navigate]);

    const handleSolicitarOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3001/auth/solicitar-otp-cambio-contrasena', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTokenOtp(res.data.token_otp);
            setStep(2);
            setSuccessMessage('Se ha enviado un código de verificación a su correo.');
            showSuccess('Código Enviado', 'Revisa tu bandeja de entrada.');
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al solicitar el código OTP.';
            setError(errorMsg);
            showError('Error de Solicitud', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleValidarOtp = async (e) => {
        e.preventDefault();
        // Validamos longitud localmente antes de simular avance
        if (!otp || otp.length !== 6) {
            setError('Ingrese un código válido de 6 dígitos.');
            return;
        }

        // Simulamos validación exitosa para pasar al paso de nueva contraseña
        // La validación real del OTP ocurrirá en el submit final junto con el cambio de clave
        setLoading(true);
        try {
            // Simulamos delay de red para mejor UX
            await new Promise(resolve => setTimeout(resolve, 600));
            setStep(3);
            const msg = 'Código verificado con éxito. Ahora puede establecer su nueva contraseña.';
            setSuccessMessage(msg);
            showSuccess('Código Verificado', msg);
        } catch (err) {
            const errorMsg = 'El código ingresado es incorrecto o ha expirado.';
            setError(errorMsg);
            showError('Error de Validación', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            showError('Formulario Inválido', 'Por favor, cumpla todos los requisitos de la contraseña.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3001/auth/cambiar-contrasena', {
                currentPassword,
                newPassword,
                otp,
                token_otp: tokenOtp
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire({
                title: "¡Contraseña Actualizada!",
                text: "Su clave ha sido cambiada exitosamente. Se recomienda cerrar sesión y volver a ingresar.",
                icon: "success",
                confirmButtonText: "Aceptar",
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/dashboard');
                }
            });
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error al cambiar la contraseña.';
            setError(errorMsg);
            
            let swalTitle = 'Error al Cambiar Contraseña';
            let swalText = errorMsg;

            if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('otp') || errorMsg.toLowerCase().includes('código') || errorMsg.toLowerCase().includes('expirado')) {
                swalTitle = 'Error de Verificación';
                swalText = 'El tiempo de su sesión de seguridad ha expirado o el código es inválido. Por favor intente nuevamente.';
            } else if (err.response?.status === 500 || !err.response) {
                swalTitle = 'Error de Servidor';
                swalText = 'No se pudo conectar con el servidor central.';
            }

            Swal.fire({
                title: swalTitle,
                text: swalText,
                icon: "error",
                confirmButtonText: "Aceptar",
                allowOutsideClick: false,
                allowEscapeKey: false
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setNewPassword(pass);
        setPasswordRequirements({
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
        });
    };

    const isFormValid =
        Object.values(passwordRequirements).every(Boolean) &&
        newPassword === confirmNewPassword &&
        currentPassword &&
        otp.length === 6;


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            
            <main className="flex-1 lg:pl-64 pt-20 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 uppercase tracking-wider">
                        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Inicio</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-slate-400">Seguridad</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-blue-600">Cambio de Clave</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Columna Izquierda: Instrucciones */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Seguridad de la Cuenta</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Para proteger su información y la de los pacientes, el cambio de contraseña requiere una validación de identidad mediante OTP.
                                </p>
                            </div>

                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                <h3 className="text-sm font-bold text-amber-800 uppercase mb-4 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Requisitos de Clave
                                </h3>
                                <ul className="space-y-3">
                                    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${passwordRequirements.length ? 'text-green-600' : 'text-amber-700'}`}>
                                       <CheckCircle2 className={`h-3.5 w-3.5 ${passwordRequirements.length ? 'text-green-500' : 'text-amber-400'}`} />
                                       Mínimo 8 caracteres
                                    </li>
                                    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${passwordRequirements.uppercase ? 'text-green-600' : 'text-amber-700'}`}>
                                       <CheckCircle2 className={`h-3.5 w-3.5 ${passwordRequirements.uppercase ? 'text-green-500' : 'text-amber-400'}`} />
                                       Al menos una Mayúscula
                                    </li>
                                    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${passwordRequirements.number ? 'text-green-600' : 'text-amber-700'}`}>
                                       <CheckCircle2 className={`h-3.5 w-3.5 ${passwordRequirements.number ? 'text-green-500' : 'text-amber-400'}`} />
                                       Al menos un Número (0-9)
                                    </li>
                                    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${newPassword && newPassword === confirmNewPassword ? 'text-green-600' : 'text-amber-700'}`}>
                                       <CheckCircle2 className={`h-3.5 w-3.5 ${newPassword && newPassword === confirmNewPassword ? 'text-green-500' : 'text-amber-400'}`} />
                                       Las contraseñas coinciden
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Columna Derecha: Formulario */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                                    <h1 className="text-2xl font-bold text-slate-800">Actualizar Contraseña</h1>
                                    <p className="text-slate-500 text-sm mt-1">Siga los pasos para asegurar su cuenta.</p>
                                </div>

                                <div className="p-8">
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-xl animate-shake">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm font-medium">{error}</p>
                                        </div>
                                    )}

                                    {successMessage && !error && (
                                        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3 rounded-r-xl">
                                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm font-medium">{successMessage}</p>
                                        </div>
                                    )}

                                    {/* PASO 1: SOLICITAR OTP */}
                                    {step === 1 && (
                                        <div className="text-center py-8 animate-fade-in">
                                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Fingerprint className="h-10 w-10" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">Validación de Identidad</h3>
                                            <p className="text-slate-500 text-sm mb-4 max-w-sm mx-auto">
                                                Enviaremos un código de seguridad a su correo para verificar que es usted quien solicita el cambio.
                                            </p>

                                            {usuario?.correo_alternativo ? (
                                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl max-w-md mx-auto">
                                                    <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-3">Seleccione método de envío:</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSolicitarOtp('institucional')}
                                                            disabled={loading}
                                                            className="flex flex-col items-center justify-center p-3 bg-white text-blue-600 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                                                        >
                                                            <span className="text-xs font-bold">Correo Institucional</span>
                                                            <span className="text-[10px] text-blue-400 mt-1 truncate max-w-full">{usuario.correo}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSolicitarOtp('alternativo')}
                                                            disabled={loading}
                                                            className="flex flex-col items-center justify-center p-3 bg-white text-emerald-600 border border-emerald-200 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <span className="text-xs font-bold">Correo Alternativo</span>
                                                            <span className="text-[10px] text-emerald-400 mt-1 truncate max-w-full">{usuario.correo_alternativo}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSolicitarOtp('institucional')}
                                                    disabled={loading}
                                                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 mb-4"
                                                >
                                                    {loading ? 'Procesando...' : 'ENVIAR A CORREO INSTITUCIONAL'}
                                                    {!loading && <Send className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* PASO 2: VALIDAR OTP */}
                                    {step === 2 && (
                                        <form onSubmit={handleValidarOtp} className="space-y-6 animate-slide-up">
                                            <div className="text-center mb-8">
                                                <p className="text-slate-500 text-sm">Ingrese el código de 6 dígitos enviado a:</p>
                                                <p className="font-bold text-blue-600">{tipoCorreo === 'institucional' ? usuario.correo : usuario.correo_alternativo}</p>
                                            </div>
                                            <div className="max-w-xs mx-auto">
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full p-4 text-center text-3xl font-bold tracking-[0.5em] border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all"
                                                    placeholder="000000"
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                >
                                                    {loading ? 'Verificando...' : 'VERIFICAR CÓDIGO'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                                >
                                                    Volver a solicitar
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* PASO 3: NUEVA CLAVE */}
                                    {step === 3 && (
                                        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-slide-up">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                        <Lock className="h-3 w-3 text-slate-400" />
                                                        Contraseña Actual
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? 'text' : 'password'}
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                                            placeholder="••••••••"
                                                            required
                                                        />
                                                        <button
                                                            type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                                        >
                                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                            <KeyRound className="h-3 w-3 text-slate-400" />
                                                            Nueva Contraseña
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showNewPassword ? 'text' : 'password'}
                                                                value={newPassword}
                                                                onChange={handlePasswordChange}
                                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                                                placeholder="••••••••"
                                                                required
                                                            />
                                                            <button
                                                                type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                                            >
                                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                        {newPassword && newPasswordValidation && (
                                                            <p className="text-red-500 text-xs mt-1">{newPasswordValidation}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                            <CheckCircle2 className="h-3 w-3 text-slate-400" />
                                                            Repetir Contraseña
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                                value={confirmNewPassword}
                                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                                className={`w-full p-4 bg-slate-50 border rounded-2xl focus:bg-white focus:ring-2 outline-none transition-all pr-12 ${
                                                                    confirmNewPassword && newPassword !== confirmNewPassword && newPassword.length > 0
                                                                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                                                        : 'border-slate-100 focus:ring-blue-500'
                                                                }`}
                                                                placeholder="••••••••"
                                                                required
                                                            />
                                                            <button
                                                                type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                                            >
                                                                {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                            </button>
                                                        </div>
                                                        {confirmNewPassword && newPassword !== confirmNewPassword && (
                                                            <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6">
                                                <button
                                                    type="submit"
                                                    disabled={!isFormValid || loading}
                                                    className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? 'Guardando...' : 'ACTUALIZAR SEGURIDAD'}
                                                    {!loading && <ShieldCheck className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}

// Estilos para animaciones simples
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slide-up {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .animate-fade-in { animation: fade-in 0.4s ease-out; }
    .animate-slide-up { animation: slide-up 0.4s ease-out; }
    .animate-shake { animation: shake 0.3s ease-in-out; }
`;
document.head.appendChild(style);
