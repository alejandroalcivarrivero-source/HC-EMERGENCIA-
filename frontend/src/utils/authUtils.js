/**
 * @param {number} roleId El ID del rol del usuario.
 * @returns {string} La ruta de redirección basada en el rol.
 */
export const getRedirectPath = (roleId) => {
  // Rol ID 5 parece ser un rol específico (quizás un médico o un rol con acceso especial)
  const id = Number(roleId);

  switch (id) {
    case 5:
      // Ejemplo: Redirigir a la pantalla de atención de emergencia si es un médico.
      return '/atencion-emergencia'; 
    case 1:
      // Ejemplo: Redirigir a dashboard principal para administradores.
      return '/dashboard';
    default:
      // Ruta por defecto para otros roles o si el ID no es válido.
      return '/login';
  }
};

/**
 * Limpia la sesión del usuario.
 */
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
};