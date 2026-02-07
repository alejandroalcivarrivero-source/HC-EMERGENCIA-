const { Sequelize, DataTypes, Op } = require('sequelize');

// Force connection to SISA_EC (or whatever DB is configured in env, but here hardcoded for simulation as per original)
// Using local config from .env or default if needed, but original script had hardcoded IP.
// I will assume the user wants to run this against the configured DB in environment_details which seems to be localhost or tunnel.
// However, the original script had '172.16.1.248'. I should stick to that if it works, or use the one from 'backend/config/database.js' logic.
// The previous run failed connecting to 172.16.1.248? No, it said "Conexión establecida". So it works.

const sequelize = new Sequelize('SISA_EC', 'TICS', 'TICS20141', {
    host: '172.16.1.248',
    dialect: 'mariadb',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

// Models
const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombres: { type: DataTypes.STRING },
    apellidos: { type: DataTypes.STRING },
    activo: { type: DataTypes.BOOLEAN }
}, { tableName: 'USUARIOS_SISTEMA', timestamps: false });

const CatCie10 = sequelize.define('CatCie10', {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    descripcion: { type: DataTypes.STRING }
}, { tableName: 'CAT_CIE10', timestamps: false });

const Paciente = sequelize.define('Pacientes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    primer_nombre: { type: DataTypes.STRING },
    primer_apellido: { type: DataTypes.STRING },
    segundo_nombre: { type: DataTypes.STRING },
    segundo_apellido: { type: DataTypes.STRING },
    nombres: { type: DataTypes.VIRTUAL, get() { return `${this.primer_nombre} ${this.segundo_nombre || ''}`.trim(); } },
    apellidos: { type: DataTypes.VIRTUAL, get() { return `${this.primer_apellido} ${this.segundo_apellido || ''}`.trim(); } }
}, { tableName: 'PACIENTES', timestamps: false });

const Admision = sequelize.define('Admision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pacienteId: { type: DataTypes.INTEGER, field: 'paciente_id' },
    fecha_creacion: { type: DataTypes.DATE, field: 'fecha_creacion' },
    estado_paciente_id: { type: DataTypes.INTEGER, field: 'estado_paciente_id' }
}, { tableName: 'ADMISIONES', timestamps: false });

const AtencionEmergencia = sequelize.define('AtencionEmergencia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pacienteId: { type: DataTypes.INTEGER, field: 'pacienteId' },
    admisionId: { type: DataTypes.INTEGER, field: 'admisionId' },
    usuarioId: { type: DataTypes.INTEGER, field: 'usuarioId' },
    fechaAtencion: { type: DataTypes.DATEONLY, field: 'fechaAtencion' },
    horaAtencion: { type: DataTypes.STRING, field: 'horaAtencion' },
    condicionLlegada: { type: DataTypes.ENUM('ESTABLE', 'INESTABLE', 'FALLECIDO'), field: 'condicionLlegada' },
    firma_digital_hash: { type: DataTypes.STRING, field: 'firma_digital_hash' },
    estadoFirma: { type: DataTypes.ENUM('BORRADOR', 'PENDIENTE_FIRMA', 'FINALIZADO_FIRMADO'), field: 'estado_firma' }
}, { tableName: 'ATENCION_EMERGENCIA', timestamps: true });

const Form008Emergencia = sequelize.define('Form008Emergencia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    atencionId: { type: DataTypes.INTEGER, field: 'atencionId' },
    motivoAtencion: { type: DataTypes.TEXT, field: 'motivoAtencion' },
    enfermedadProblemaActual: { type: DataTypes.TEXT, field: 'enfermedadProblemaActual' },
    examenFisico: { type: DataTypes.TEXT, field: 'examenFisico' },
    planTratamiento: { type: DataTypes.TEXT, field: 'planTratamiento' },
    firma_digital_hash: { type: DataTypes.STRING, field: 'firma_digital_hash' }
}, { tableName: 'FORM_008_EMERGENCIA', timestamps: true });

const DetalleDiagnostico = sequelize.define('DetalleDiagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    atencionEmergenciaId: { type: DataTypes.INTEGER, field: 'atencion_emergencia_id' },
    codigoCIE10: { type: DataTypes.STRING, field: 'codigo_cie10' },
    tipoDiagnostico: { type: DataTypes.STRING, field: 'tipo_diagnostico' }
}, { tableName: 'DETALLE_DIAGNOSTICOS', timestamps: true });


async function runSimulation() {
    console.log('🚀 Starting SISA_EC Saving Simulation (Refined Persistence)...');
    try {
        await sequelize.authenticate();
        console.log('✅ Database Connected');

        // 0. Ensure Schema (Fix for Missing Columns/Tables)
        console.log('🔧 Verifying Schema...');
        
        // Check/Create FORM_008_EMERGENCIA
        await Form008Emergencia.sync();
        console.log('✅ Table FORM_008_EMERGENCIA synced.');

         // Check atencionId in FORM_008_EMERGENCIA (Fix for Unknown column error)
         try {
            console.log('⚠️ Attempting to add atencionId to FORM_008_EMERGENCIA...');
            await sequelize.query("ALTER TABLE FORM_008_EMERGENCIA ADD COLUMN atencionId INT(11) DEFAULT NULL");
            console.log('✅ Column atencionId added to Form008.');
        } catch (e) {
             if (e.message.includes('Duplicate column') || (e.original && e.original.code === 'ER_DUP_FIELDNAME')) {
                console.log('ℹ️ Column atencionId already exists in FORM_008_EMERGENCIA.');
            } else {
                console.error('⚠️ Error adding atencionId:', e.message);
            }
        }

        // Check firma_digital_hash in ATENCION_EMERGENCIA
        try {
            console.log('⚠️ Attempting to add firma_digital_hash to ATENCION_EMERGENCIA...');
            await sequelize.query("ALTER TABLE ATENCION_EMERGENCIA ADD COLUMN firma_digital_hash VARCHAR(255) DEFAULT NULL");
            console.log('✅ Column firma_digital_hash added.');
        } catch (e) {
            if (e.message.includes('Duplicate column') || (e.original && e.original.code === 'ER_DUP_FIELDNAME')) {
                console.log('ℹ️ Column firma_digital_hash already exists in ATENCION_EMERGENCIA.');
            } else {
                console.error('⚠️ Error adding column:', e.message);
            }
        }

         // Check firma_digital_hash in FORM_008_EMERGENCIA
         try {
            console.log('⚠️ Attempting to add firma_digital_hash to FORM_008_EMERGENCIA...');
            await sequelize.query("ALTER TABLE FORM_008_EMERGENCIA ADD COLUMN firma_digital_hash VARCHAR(255) DEFAULT NULL");
            console.log('✅ Column firma_digital_hash added to Form008.');
        } catch (e) {
            if (e.message.includes('Duplicate column') || (e.original && e.original.code === 'ER_DUP_FIELDNAME')) {
                console.log('ℹ️ Column firma_digital_hash already exists in FORM_008_EMERGENCIA.');
            } else {
                console.error('⚠️ Error adding column Form008:', e.message);
            }
        }

        // 1. Find Data
        const user = await Usuario.findOne({ where: { activo: true } });
        const validUserId = user ? user.id : 1;
        console.log(`✅ User: ${validUserId}`);

        const cie10 = await CatCie10.findOne();
        const validCie10 = cie10 ? cie10.codigo : 'A00';
        console.log(`✅ CIE10: ${validCie10}`);

        // Search Patient "Pablo Andrés Alcivar Alcivar"
        let patient = await Paciente.findOne({ where: { primer_nombre: 'Pablo', primer_apellido: 'Alcivar' } });
        if (!patient) {
            console.error('❌ Patient Pablo Alcivar not found.');
            return;
        }
        console.log(`✅ Patient: ${patient.id}`);

        const admission = await Admision.findOne({ where: { paciente_id: patient.id }, order: [['fecha_creacion', 'DESC']] });
        if (!admission) {
             console.error('❌ No active admission.');
             return;
        }
        console.log(`✅ Admission: ${admission.id}`);

        // 2. Medical Phase (Create Attention + Form008)
        console.log('\n👨‍⚕️ Phase 2: Medical - Creating Attention Record...');
        
        let atencion = await AtencionEmergencia.findOne({ where: { admisionId: admission.id } });
        if (!atencion) {
            atencion = await AtencionEmergencia.create({
                pacienteId: patient.id,
                admisionId: admission.id,
                usuarioId: validUserId,
                fechaAtencion: new Date(),
                horaAtencion: '10:00',
                condicionLlegada: 'ESTABLE',
                estadoFirma: 'BORRADOR'
            });
            console.log(`✅ Attention Created (Header): ${atencion.id}`);
        } else {
            console.log(`✅ Attention Exists (Header): ${atencion.id}`);
        }

        // Save Medical Data to FORM_008_EMERGENCIA
        console.log('📝 Saving Medical Data to FORM_008_EMERGENCIA...');
        const medicalData = {
            atencionId: atencion.id,
            motivoAtencion: 'Dolor abdominal intenso',
            enfermedadProblemaActual: 'Paciente refiere dolor de 3 dias...',
            examenFisico: JSON.stringify({ abdomen: 'Doloroso' }),
            planTratamiento: JSON.stringify([{ medicamento: 'Paracetamol' }])
        };

        let form008 = await Form008Emergencia.findOne({ where: { atencionId: atencion.id } });
        if (form008) {
            await form008.update(medicalData);
            console.log(`✅ Form 008 Updated: ${form008.id}`);
        } else {
            form008 = await Form008Emergencia.create(medicalData);
            console.log(`✅ Form 008 Created: ${form008.id}`);
        }

        // 3. Signature Phase
        console.log('\n✍️ Phase 4: Closure & Digital Signature...');
        const simulatedHash = 'HASH_SIMULADO_' + Date.now();
        
        // Update Header
        await atencion.update({
            firma_digital_hash: simulatedHash,
            estadoFirma: 'FINALIZADO_FIRMADO'
        });
        console.log(`✅ Header Signed: ${simulatedHash}`);

        // Update Form008 (Redundancy check)
        await form008.update({
            firma_digital_hash: simulatedHash
        });
        console.log(`✅ Form008 Signed: ${simulatedHash}`);

        console.log('\n🎉 Simulation Completed Successfully!');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        process.exit();
    }
}

runSimulation();
