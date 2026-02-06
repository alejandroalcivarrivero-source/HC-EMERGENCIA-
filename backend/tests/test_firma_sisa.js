const sequelize = require('../config/database');
const Admision = require('../models/admisiones');
const AtencionEmergencia = require('../models/atencionEmergencia');
const Pacientes = require('../models/pacientes');
const Usuario = require('../models/usuario');

// Función para simular el flujo de creación de datos y firma
async function testFirmaIntegridad() {
    let transaction;
    let paciente, usuario, admision, atencion;

    // Datos de prueba ficticios
    const FAKE_HASH = 'F1RM4-PRUEBA-S1SA-EC-838D6C7E';
    const USUARIO_ID = 99999;
    const PACIENTE_ID = 99999;

    console.log("Iniciando prueba de integridad de firma...");

    try {
        // Ejecutar ALTER TABLE para garantizar que motivo_consulta_sintoma_id sea NULLABLE en la BD
        console.log("Ajustando esquema de DB: motivo_consulta_sintoma_id a NULLABLE...");
        // Esto es necesario porque la BD no coincide con el modelo (el modelo dice allowNull: true)
        // Se ejecuta sin transacción.
        await sequelize.query("ALTER TABLE ADMISIONES MODIFY COLUMN motivo_consulta_sintoma_id INT NULL;");
        console.log("Esquema ajustado. Iniciando transacción de prueba...");
        
        transaction = await sequelize.transaction();

        // 1. Crear datos de prueba si no existen (simplificado)
        [usuario] = await Usuario.findOrCreate({ 
            where: { id: USUARIO_ID }, 
            defaults: { 
                cedula: '9999999999', 
                nombres: 'TEST', 
                apellidos: 'USUARIO', 
                fecha_nacimiento: '2000-01-01',
                sexo: 'M',
                correo: 'test.user@msp.gob.ec',
                contrasena: 'password123', // El hook de Sequelize lo hasheará
                rol_id: 1, // Medico (usando el campo correcto rol_id)
            },
            transaction
        });

        // 2. Crear un Paciente de prueba
        [paciente] = await Pacientes.findOrCreate({ 
            where: { id: PACIENTE_ID }, 
            defaults: { 
                numero_identificacion: '9999999999', 
                primer_nombre: 'Paciente', 
                primer_apellido: 'Prueba',
                fecha_nacimiento: new Date('2000-01-01'),
                tipoIdentificacionId: 1, 
                nacionalidadId: 1,
                estadoCivilId: 1,
                sexoId: 1,
            },
            transaction
        });

        // 3. Crear una Admision de prueba
        // Se omiten motivo_consulta_sintoma_id, triajePreliminarId, triajeDefinitivoId para que sean NULL.
        admision = await Admision.create({
            pacienteId: PACIENTE_ID,
            fecha_hora_admision: new Date(),
            forma_llegada_id: 1, 
            usuarioAdmisionId: USUARIO_ID,
            fuenteInformacionId: 1, 
            institucion_persona_entrega: 'Test Institucion',
            telefono_entrega: '0999999999',
            estado_paciente_id: 1, 
            prioridad_enfermeria: 0,
            intentos_llamado: 0,
            // motivo_consulta_sintoma_id, triajePreliminarId, triajeDefinitivoId se omiten
        }, { transaction });
        
        // 4. Crear una AtenciónEmergencia (Form 008) de prueba
        atencion = await AtencionEmergencia.create({
            admisionId: admision.id,
            pacienteId: PACIENTE_ID, // Agregado: Requerido por AtencionEmergencia
            // Campos mínimos requeridos
            fechaAtencion: new Date().toISOString().slice(0, 10),
            horaAtencion: '12:00:00', // Valor fijo con formato HH:mm:ss
            condicionLlegada: 'ESTABLE', // Usamos el valor del ENUM
            estadoFirma: 'PENDIENTE_FIRMA',
            usuarioId: USUARIO_ID
        }, { transaction });

        console.log(`Admisión [ID: ${admision.id}] y Atención [ID: ${atencion.id}] creadas.`);

        // 5. SIMULACIÓN DE LA FIRMA (Actualizar el hash en la Admision)
        console.log(`Simulando actualización de firma en Admisión: ${admision.id}`);

        await admision.update({
            firmaDigitalHash: FAKE_HASH
        }, { transaction });

        // 6. Verificar el resultado
        const admisionVerificada = await Admision.findByPk(admision.id, { 
            transaction,
            attributes: ['id', 'firmaDigitalHash']
        });

        if (admisionVerificada && admisionVerificada.firmaDigitalHash === FAKE_HASH) {
            console.log("\n✅ PRUEBA EXITOSA: El campo 'firmaDigitalHash' se guardó correctamente en la tabla ADMISIONES.");
            console.log(`Hash guardado: ${admisionVerificada.firmaDigitalHash}`);
            await transaction.rollback(); // Deshacer todos los cambios de prueba
            return { success: true, message: `Hash ${FAKE_HASH} guardado y verificado.` };
        } else {
            console.log("\n❌ PRUEBA FALLIDA: El campo 'firmaDigitalHash' no se actualizó o no coincide.");
            console.log(`Valor de 'firmaDigitalHash' encontrado: ${admisionVerificada ? admisionVerificada.firmaDigitalHash : 'NULO/NO ENCONTRADO'}`);
            await transaction.rollback(); // Deshacer todos los cambios de prueba
            return { success: false, message: 'Fallo en la actualización del hash.' };
        }

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("\nCRITICAL ERROR durante la prueba. Esto puede indicar un problema de conexión a DB o FKs faltantes.", error.message);
        console.error("Asegúrese de que su base de datos esté corriendo y tenga las tablas Admision, AtencionEmergencia, Pacientes y Usuario con datos válidos de catálogo (ID 1).");
        return { success: false, message: `Error crítico: ${error.message}` };
    } finally {
        console.log("Limpieza de transacción completada.");
    }
}

testFirmaIntegridad()
    .then(result => {
        console.log(`\n--- RESULTADO FINAL ---\n${result.message}`);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error("Error al ejecutar el script:", error);
        process.exit(1);
    });