const { Pacientes } = require('./backend/models');

async function testCount() {
    try {
        console.log('Iniciando prueba de Pacientes.count()...');
        
        if (!Pacientes) {
            console.error('ERROR: El modelo Pacientes no se exportó correctamente desde index.js');
            process.exit(1);
        }

        const count = await Pacientes.count();
        console.log(`\n>>> RESULTADO: El conteo de pacientes es: ${count} <<<`);
        
        if (count === 3) {
            console.log('¡ÉXITO! El conteo coincide con el valor esperado de 3.');
        } else {
            console.log(`AVISO: El conteo es ${count}, se esperaba 3. Verifica si los datos en la DB son correctos.`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('ERROR CRÍTICO DURANTE LA PRUEBA:');
        console.error(error);
        process.exit(1);
    }
}

testCount();
