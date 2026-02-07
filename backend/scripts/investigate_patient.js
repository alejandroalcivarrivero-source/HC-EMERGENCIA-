const sequelize = require('../config/database');

async function investigarPaciente() {
  await sequelize.connectWithFallback();
  try {
    // Ampliar búsqueda
    const terminos = ['Andrés', 'Andres', 'Alejandro'];
    let pacientes = [];

    for (const termino of terminos) {
        console.log(`Buscando por término: %${termino}%`);
        const p = await sequelize.query(
          `SELECT * FROM PACIENTES
           WHERE primer_nombre LIKE :term
           OR segundo_nombre LIKE :term
           OR primer_apellido LIKE :term
           OR segundo_apellido LIKE :term`,
          {
            replacements: { term: `%${termino}%` },
            type: sequelize.QueryTypes.SELECT
          }
        );
        pacientes = [...pacientes, ...p];
    }
    
    // Eliminar duplicados
    pacientes = [...new Map(pacientes.map(item => [item.id, item])).values()];
    
    console.log(`Encontrados ${pacientes.length} pacientes con búsqueda específica.`);

    // Diagnóstico general de la tabla
    const tables = await sequelize.query('SHOW TABLES', { type: sequelize.QueryTypes.SELECT });
    console.log('Tablas en la base de datos:', tables.map(t => Object.values(t)[0]));

    const totalPacientes = await sequelize.query('SELECT COUNT(*) as count FROM PACIENTES', { type: sequelize.QueryTypes.SELECT });
    console.log(`Total de pacientes en la tabla PACIENTES: ${totalPacientes[0].count}`);

    const totalAdmisiones = await sequelize.query('SELECT COUNT(*) as count FROM ADMISIONES', { type: sequelize.QueryTypes.SELECT });
    console.log(`Total de admisiones en la tabla ADMISIONES: ${totalAdmisiones[0].count}`);
    
    // Buscar admisiones huérfanas
    const huerfanas = await sequelize.query(
        `SELECT a.id, a.paciente_id, a.institucion_persona_entrega
         FROM ADMISIONES a
         LEFT JOIN PACIENTES p ON a.paciente_id = p.id
         WHERE p.id IS NULL`,
         { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Admisiones huérfanas (sin paciente en BD): ${huerfanas.length}`);
    if (huerfanas.length > 0) {
        huerfanas.forEach(h => console.log(`- Admisión ${h.id} busca Paciente ${h.paciente_id} (${h.institucion_persona_entrega})`));
    }

    const columns = await sequelize.query('SHOW COLUMNS FROM PACIENTES', { type: sequelize.QueryTypes.SELECT });
    console.log('Columnas de PACIENTES:', columns.map(c => c.Field));
    
    for (const paciente of pacientes) {
        console.log(`Paciente encontrado: ID=${paciente.id}, Nombre=${paciente.primer_nombre} ${paciente.primer_apellido}`);
        
        // Buscar admisiones de este paciente
        const admisiones = await sequelize.query(
          `SELECT a.* FROM ADMISIONES a WHERE a.paciente_id = :pid ORDER BY a.fecha_hora_admision DESC`,
          {
            replacements: { pid: paciente.id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        console.log(`  - Admisiones encontradas: ${admisiones.length}`);
        
        for (const adm of admisiones) {
            console.log(`    > Admisión ID: ${adm.id}, Fecha: ${adm.fecha_hora_admision}, EstadoID: ${adm.estado_paciente_id}, TriajeID: ${adm.triaje_preliminar_id}`);
             // Historial estados
              const estados = await sequelize.query(
                `SELECT * FROM ATENCION_PACIENTE_ESTADO WHERE admisionId = :aid ORDER BY createdAt DESC`,
                 {
                    replacements: { aid: adm.id },
                    type: sequelize.QueryTypes.SELECT
                 }
              ).catch(e => { console.log('Error estados:', e.message); return []; });
              
              if(estados.length > 0) {
                   console.log('      Historial Estados:');
                   estados.forEach(e => console.log(`      - ID: ${e.id}, EstadoID: ${e.estado_id}, Fecha: ${e.createdAt}`));
              }
        }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

investigarPaciente();
