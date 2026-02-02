const validarCedula = (cedula) => {
  // 1. Verificar que no esté vacío y tenga 10 dígitos
  if (!cedula || cedula.length !== 10) {
    return false;
  }

  // 2. Verificar que los dos primeros dígitos sean provincia (1 a 24)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // 3. Verificar que el tercer dígito sea menor a 6 (para cédulas, no para RUCs)
  const tercerDigito = parseInt(cedula.substring(2, 3), 10);
  if (tercerDigito >= 6) {
    return false;
  }

  // 4. Aplicar algoritmo del Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula.substring(9, 10), 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    const digito = parseInt(cedula.substring(i, i + 1), 10);
    let valor = digito * coeficientes[i];

    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  // 5. Calcular el dígito de control
  const modulo = suma % 10;
  let digitoControl = modulo === 0 ? 0 : 10 - modulo;

  // 6. Comparar
  return digitoControl === digitoVerificador;
};

module.exports = {
  validarCedula
};
