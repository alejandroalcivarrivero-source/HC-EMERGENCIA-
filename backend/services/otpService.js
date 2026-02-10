const crypto = require('crypto');

/**
 * Genera un código OTP de 6 dígitos.
 * @returns {string} OTP generado.
 */
const generarOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verifica si un OTP proporcionado coincide con el OTP guardado.
 * @param {string} otpIngresado - El OTP que el usuario ingresó.
 * @param {string} otpGuardado - El OTP almacenado en la base de datos o sesión.
 * @returns {boolean} True si coinciden, false de lo contrario.
 */
const verificarOTP = (otpIngresado, otpGuardado) => {
    if (!otpIngresado || !otpGuardado) return false;
    return otpIngresado === otpGuardado;
};

module.exports = {
    generarOTP,
    verificarOTP
};
