// Detectar automáticamente la IP/hostname desde donde se accede
const getApiUrl = (): string => {
  // Obtener el hostname actual (puede ser localhost, IP local, o dominio)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Siempre usar puerto 3000 para el backend
  return `http://${hostname}:3000/api`;
};

export const environment = {
  production: false,
  apiUrl: getApiUrl(), // Detecta automáticamente: localhost o IP de red
  appName: 'Sistema de Gestión Documentaria',
  appVersion: '1.0.0'
};
