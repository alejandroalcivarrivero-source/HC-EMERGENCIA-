const { Sequelize, DataTypes, Op } = require('sequelize');

// Force connection to SISA_EC
const sequelize = new Sequelize('SISA_EC', 'TICS', 'TICS20141', {
    host: '172.16.1.248',
    dialect: 'mariadb',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Helper to check table columns
async function checkColumns(tableName) {
    try {
        const [results] = await sequelize.query(`DESCRIBE ${tableName}`);
        console.log(`\n📊 Columns in ${tableName}:`, results.map(c => c.Field).join(', '));
        return results.map(c => c.Field);
    } catch (e) {
        console.error(`❌ Could not describe ${tableName}: ${e.message}`);
        return [];
    }
}

// Define models with UPPERCASE table names
const Usuario = sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombres: { type: DataTypes.STRING },
    apellidos: { type: DataTypes.STRING },
    activo: { type: DataTypes.BOOLEAN }
}, {
    tableName: 'USUARIOS_SISTEMA',
    timestamps: false
});

const CatCie10 = sequelize.define('CatCie10', {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    descripcion: { type: DataTypes.STRING }
}, {
    tableName: 'CAT_CIE10',
    timestamps: false
});

const Paciente = sequelize.define('Pacientes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    primer_nombre: { type: DataTypes.STRING, allowNull: false },
    segundo_nombre: { type: DataTypes.STRING, allowNull: true },
    primer_apellido: { type: DataTypes.STRING, allowNull: false },
    segundo_apellido: { type: DataTypes.STRING, allowNull: true },
    nombres: {
        type: DataTypes.VIRTUAL,
        get() { return `${this.getDataValue('primer_nombre')} ${this.getDataValue('segundo_nombre') || ''}`.trim(); }
    },
    apellidos: {
        type: DataTypes.VIRTUAL,
        get() { return `${this.getDataValue('primer_apellido')} ${this.getDataValue('segundo_apellido') || ''}`.trim(); }
    },
}, {
    tableName: 'PACIENTES',
    timestamps: false
});

const Admision = sequelize.define('Admision', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pacienteId: { type: DataTypes.INTEGER, field: 'paciente_id' },
    fecha_creacion: { type: DataTypes.DATE, field: 'fecha_creacion' },
    estado_paciente_id: { type: DataTypes.INTEGER, field: 'estado_paciente_id' }
}, {
    tableName: 'ADMISIONES',
    timestamps: false,
    freezeTableName: true
});

const SignosVitales = sequelize.define('SignosVitales', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admisionId: { type: DataTypes.INTEGER, field: 'admisionId' }, 
    presion_sistolica: DataTypes.INTEGER,
    presion_diastolica: DataTypes.INTEGER,
    frecuencia_cardiaca: DataTypes.INTEGER,
    temperatura: DataTypes.DECIMAL(5, 2),
    fecha_hora_registro: DataTypes.DATE,
    sin_constantes_vitales: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'SIGNOS_VITALES',
    timestamps: true
});

const AtencionEmergencia = sequelize.define('AtencionEmergencia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pacienteId: { type: DataTypes.INTEGER, field: 'pacienteId' },
    admisionId: { type: DataTypes.INTEGER, field: 'admisionId' },
    usuarioId: { type: DataTypes.INTEGER, field: 'usuarioId' },
    fechaAtencion: { type: DataTypes.DATEONLY, field: 'fechaAtencion' },
    horaAtencion: { type: DataTypes.STRING, field: 'horaAtencion' },
    condicionLlegada: { type: DataTypes.ENUM('ESTABLE', 'INESTABLE', 'FALLECIDO'), field: 'condicionLlegada' },
    // Temporarily commented out potential missing columns to allow discovery
    anamnesis: { type: DataTypes.TEXT, field: 'anamnesis' },
    examenFisico: { type: DataTypes.TEXT, field: 'examenFisico' },
    estadoFirma: { type: DataTypes.ENUM('BORRADOR', 'PENDIENTE_FIRMA', 'FINALIZADO_FIRMADO'), field: 'estado_firma' },
    esValida: { type: DataTypes.BOOLEAN, field: 'es_valida', defaultValue: true }
}, {
    tableName: 'ATENCION_EMERGENCIA',
    timestamps: true
});

const DetalleDiagnostico = sequelize.define('DetalleDiagnostico', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    atencionEmergenciaId: { type: DataTypes.INTEGER, field: 'atencion_emergencia_id' },
    codigoCIE10: { type: DataTypes.STRING, field: 'codigo_cie10' },
    tipoDiagnostico: { type: DataTypes.STRING, field: 'tipo_diagnostico' },
    condicion: { type: DataTypes.STRING, field: 'condicion' }
}, {
    tableName: 'DETALLE_DIAGNOSTICOS',
    timestamps: true
});


async function runSimulation() {
    console.log('🚀 Starting SISA_EC Saving Simulation (Target: SISA_EC)...');

    try {
        await sequelize.authenticate();
        console.log('✅ Database Connected to SISA_EC');

        // Check columns of ATENCION_EMERGENCIA to debug
        const columns = await checkColumns('ATENCION_EMERGENCIA');
        if (!columns.includes('anamnesis')) {
            console.warn('⚠️ Warning: Column "anamnesis" not found in ATENCION_EMERGENCIA. Adjusting model...');
            AtencionEmergencia.removeAttribute('anamnesis');
        }
        if (!columns.includes('examenFisico') && !columns.includes('examen_fisico')) {
             console.warn('⚠️ Warning: Column "examenFisico" not found. Adjusting...');
             AtencionEmergencia.removeAttribute('examenFisico');
        }


        // 0. Find Valid User
        console.log('🔍 Finding a valid system user...');
        const user = await Usuario.findOne({ where: { activo: true } });
        
        if (!user) {
            console.error('❌ No active user found in USUARIOS_SISTEMA to sign the records.');
            // Fallback to ID 1 if no user found, but likely will fail
        } else {
            console.log(`✅ User Found: ID ${user.id} - ${user.nombres} ${user.apellidos}`);
        }
        const validUserId = user ? user.id : 1;

        // 0.5 Find Valid CIE10 Code
        console.log('🔍 Finding a valid CIE10 code...');
        const cie10 = await CatCie10.findOne();
        if (!cie10) {
            console.error('❌ No CIE10 codes found in CAT_CIE10.');
            return;
        }
        console.log(`✅ CIE10 Code Found: ${cie10.codigo} - ${cie10.descripcion}`);
        const validCie10 = cie10.codigo;

        // 1. Find Patient
        const patientName = {
            first: 'Pablo',
            second: 'Andrés',
            last1: 'Alcivar',
            last2: 'Alcivar'
        };
        
        console.log(`🔍 Searching for patient: ${Object.values(patientName).join(' ')}`);
        
        // Use uppercase column names if needed? Usually fields are lowercase or snake_case
        // Let's assume fields are standard.
        let patient = await Paciente.findOne({
            where: {
                primer_nombre: patientName.first,
                primer_apellido: patientName.last1
            }
        });

        if (!patient) {
            console.error('❌ Patient not found!');
            return;
        }

        console.log(`✅ Patient Found: ID ${patient.id} - ${patient.nombres} ${patient.apellidos}`);

        // 2. Find Active Admission
        const admission = await Admision.findOne({
            where: { paciente_id: patient.id },
            order: [['fecha_creacion', 'DESC']]
        });

        if (!admission) {
            console.error('❌ No active admission found for patient.');
            return;
        }

        console.log(`✅ Active Admission Found: ID ${admission.id} (Created: ${admission.fecha_creacion})`);

        // 3. Phase 1: Nursing (Vital Signs)
        console.log('\n🏥 Phase 1: Nursing - Recording Vital Signs...');
        // Check columns for SIGNOS_VITALES too
        // await checkColumns('SIGNOS_VITALES');

        const vitalSigns = await SignosVitales.create({
            admisionId: admission.id,
            presion_sistolica: 120,
            presion_diastolica: 80,
            frecuencia_cardiaca: 75,
            temperatura: 37.0,
            fecha_hora_registro: new Date(),
            sin_constantes_vitales: false
        });
        console.log(`✅ Vital Signs Recorded: ID ${vitalSigns.id}`);

        // 4. Phase 2: Medical (Form 008 / AtencionEmergencia)
        console.log('\n👨‍⚕️ Phase 2: Medical - Creating Attention Record...');
        
        let atencion = await AtencionEmergencia.findOne({ where: { admisionId: admission.id } });
        
        const atencionData = {
            pacienteId: patient.id,
            admisionId: admission.id,
            usuarioId: validUserId, // Use valid user ID
            fechaAtencion: new Date(),
            horaAtencion: new Date().toTimeString().split(' ')[0],
            condicionLlegada: 'ESTABLE',
            estadoFirma: 'BORRADOR',
            esValida: true
        };

        // Add optional fields if they exist
        if (AtencionEmergencia.rawAttributes.anamnesis) {
            atencionData.anamnesis = 'Paciente refiere dolor abdominal de 3 horas de evolución.';
        }
        if (AtencionEmergencia.rawAttributes.examenFisico) {
            atencionData.examenFisico = 'Abdomen blando, depresible, doloroso.';
        }

        if (!atencion) {
            atencion = await AtencionEmergencia.create(atencionData);
            console.log(`✅ Attention Record Created: ID ${atencion.id}`);
        } else {
            await atencion.update(atencionData);
            console.log(`✅ Attention Record Updated: ID ${atencion.id}`);
        }

        // 5. Phase 3: Diagnosis
        console.log('\n🩺 Phase 3: Diagnosis - Adding CIE10 Codes...');
        const diagnostico = await DetalleDiagnostico.create({
            atencionEmergenciaId: atencion.id,
            codigoCIE10: validCie10,
            tipoDiagnostico: 'DEFINITIVO',
            condicion: 'DEFINITIVO'
        });
        console.log(`✅ Diagnosis Added: ${diagnostico.codigoCIE10}`);

        // 6. Phase 4: Closure & Signature
        console.log('\n✍️ Phase 4: Closure & Digital Signature...');
        
        const updateData = {
            estadoFirma: 'FINALIZADO_FIRMADO'
        };

        // Simulate hash generation if column exists (checking 'firma_digital_hash' or similar)
        if (columns.includes('firma_digital_hash')) {
             console.log('🔐 Column "firma_digital_hash" found. Simulating signature hash...');
             updateData['firma_digital_hash'] = 'SIMULATED_HASH_SHA256_' + new Date().getTime();
        } else if (columns.includes('hash')) {
             console.log('🔐 Column "hash" found. Simulating signature hash...');
             updateData['hash'] = 'SIMULATED_HASH_SHA256_' + new Date().getTime();
        }

        await atencion.update(updateData);
        
        console.log(`✅ Attention Finalized and Signed.`);
        console.log('\n🎉 SISA_EC Simulation Completed Successfully!');

    } catch (error) {
        console.error('❌ Simulation Failed:', error);
    } finally {
        // await sequelize.close();
        process.exit();
    }
}

runSimulation();
