const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@sgd.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;
    
    // Actualizar documento
    console.log('Actualizando documento...');
    const updateRes = await axios.put(
      `${API_URL}/documents/2`,
      { categoriaId: 5 },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('Respuesta:', JSON.stringify(updateRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
