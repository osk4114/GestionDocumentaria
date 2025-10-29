/**
 * Verificar password hash de bcrypt
 */

const bcrypt = require('bcryptjs');

const storedHash = '$2b$10$Yo/wm4qteVRVhsdn5htxXu4f8HS1PYsKsHpHkRGxAu4e79LDnYtB.';
const passwords = ['Admin123!', 'admin123', 'admin', 'Admin123', 'password'];

console.log('🔐 Verificando contraseñas posibles...\n');

passwords.forEach(pwd => {
  const isMatch = bcrypt.compareSync(pwd, storedHash);
  console.log(`${pwd.padEnd(15)} : ${isMatch ? '✅ CORRECTA' : '❌'}`);
});

// También mostrar cómo generar un nuevo hash
console.log('\n📝 Si quieres crear un nuevo hash para "Admin123!":');
const newHash = bcrypt.hashSync('Admin123!', 10);
console.log(newHash);
