/**
 * Valida una cédula ecuatoriana usando el algoritmo de Módulo 10.
 * @param {string} cedula - El número de cédula a validar.
 * @returns {boolean} - True si la cédula es válida, false en caso contrario.
 */
export const validarCedulaEcuador = (cedula) => {
    if (typeof cedula !== 'string' || cedula.length !== 10) {
        return false;
    }

    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(cedula)) {
        return false;
    }

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
        // 30 es para ecuatorianos en el exterior, pero generalmente se valida 1-24
        if (provincia !== 30) {
            return false;
        }
    }

    const tercerDigito = parseInt(cedula.substring(2, 3), 10);
    if (tercerDigito > 5) {
        return false;
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitoVerificador = parseInt(cedula.substring(9, 10), 10);
    let suma = 0;

    for (let i = 0; i < 9; i++) {
        let valor = parseInt(cedula.substring(i, i + 1), 10) * coeficientes[i];
        if (valor > 9) {
            valor -= 9;
        }
        suma += valor;
    }

    const total = (Math.ceil(suma / 10) * 10);
    let resultado = total - suma;

    if (resultado === 10) {
        resultado = 0;
    }

    return resultado === digitoVerificador;
};

/**
 * Valida que una contraseña cumpla con las reglas estrictas:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * @param {string} password - La contraseña a validar
 * @returns {string|null} - Un mensaje de error si no es válida, o null si es correcta.
 */
export const validarPasswordEstricto = (password) => {
    if (!password) return "La contraseña es requerida.";
    if (password.length < 8) return "Debe tener al menos 8 caracteres.";
    if (!/[A-Z]/.test(password)) return "Debe incluir al menos una mayúscula.";
    if (!/[0-9]/.test(password)) return "Debe incluir al menos un número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Debe incluir al menos un carácter especial (!@#$%^&*...).";
    return null;
};
