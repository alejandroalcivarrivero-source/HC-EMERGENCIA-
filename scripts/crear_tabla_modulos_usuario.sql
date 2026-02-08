-- Crear la tabla de módulos
CREATE TABLE modulos (
    modulo_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_modulo VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Insertar los módulos iniciales
INSERT INTO modulos (nombre_modulo, descripcion) VALUES
('Admision', 'Permite el registro de nuevos pacientes en el sistema.'),
('Triage', 'Permite la clasificación de pacientes según la urgencia.'),
('Atencion Medica', 'Permite realizar la atención médica completa (Formulario 008).');

-- Crear la tabla de relación entre usuarios y módulos
CREATE TABLE usuario_modulos (
    usuario_modulo_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    modulo_id INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    FOREIGN KEY (usuario_id) REFERENCES usuarios_sistema(usuario_id),
    FOREIGN KEY (modulo_id) REFERENCES modulos(modulo_id)
);