const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

async function runSqlFile(filename) {
  try {
    // Intentar conectar con la lógica de fallback definida en database.js
    if (typeof sequelize.connectWithFallback === 'function') {
        console.log('Using connectWithFallback...');
        await sequelize.connectWithFallback();
    } else {
        await sequelize.authenticate();
    }
    console.log('DB Connection successful.');

    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split statements by semicolon, handling delimiters if necessary (simplified)
    // Removing comments to avoid issues with splitting
    const cleanSql = sql.replace(/--.*$/gm, '');
    const statements = cleanSql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await sequelize.query(statement);
                console.log('Executed statement.');
            } catch (queryError) {
                // Ignore "Column already exists" or similar specific errors if needed
                // But report others
                if (queryError.original && queryError.original.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, continuing...');
                } else if (queryError.name === 'TypeError' && queryError.message.includes("Cannot delete property 'meta'")) {
                     // Sequelize/MariaDB bug on some statements that return no result but metadata
                     console.log('Statement executed (metadata error ignored).');
                } else {
                    throw queryError;
                }
            }
        }
    }

    console.log('SQL file executed successfully.');
  } catch (error) {
    console.error('Error executing SQL file:', error);
  } finally {
    // await sequelize.close(); // Don't close if pool is managed or if it causes issues with proxy
    // Force exit to ensure process ends
    process.exit(0);
  }
}

const filename = process.argv[2];
if (!filename) {
    console.error('Please provide a filename relative to backend/scripts/');
    process.exit(1);
}

runSqlFile(filename);
