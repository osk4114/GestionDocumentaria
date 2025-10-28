const mysql = require('mysql2/promise');

async function checkStatuses() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sgd_db'
    });

    console.log('✓ Conectado a la base de datos\n');

    const [statuses] = await connection.query('SELECT * FROM document_statuses ORDER BY id');
    
    console.log('📋 Estados en la base de datos:\n');
    console.log('ID | Nombre        | Código      | Color');
    console.log('---|---------------|-------------|-------');
    statuses.forEach(status => {
      console.log(`${status.id}  | ${status.nombre.padEnd(13)} | ${status.codigo.padEnd(11)} | ${status.color}`);
    });

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStatuses();
