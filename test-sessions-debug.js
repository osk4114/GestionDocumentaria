/**
 * Test rápido de sesiones
 */
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth';

async function test() {
  try {
    // 1. Login
    console.log('1. Login...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: 'admin@sgd.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.data.token;
    console.log('✓ Token obtenido');
    
    // 2. Listar sesiones
    console.log('\n2. Listar sesiones...');
    const sessionsRes = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Sesiones:', JSON.stringify(sessionsRes.data, null, 2));
    
  } catch (error) {
    console.log('✗ Error:', error.response?.data || error.message);
  }
}

test();
