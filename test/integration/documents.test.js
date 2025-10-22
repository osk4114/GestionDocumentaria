/**
 * Tests de integración para endpoints de documentos
 */

const request = require('supertest');
const { app } = require('../../server');
const { User, Document, Sender, DocumentType, DocumentStatus, Area, Role } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('API de Documentos - Tests de Integración', () => {
  
  let testUser;
  let authToken;
  let testDocument;
  let testSender;
  let testDocType;
  let testStatus;
  let testArea;

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Crear datos de prueba
    const role = await Role.findOne({ where: { nombre: 'Funcionario' } }) ||
                  await Role.create({ nombre: 'Funcionario', descripcion: 'Test' });

    testArea = await Area.findOne({ where: { nombre: 'Test Area Docs' } }) ||
                await Area.create({ nombre: 'Test Area Docs', sigla: 'TAD' });

    const hashedPassword = await bcrypt.hash('testpassword', 10);
    testUser = await User.create({
      email: 'testdocs@test.com',
      password: hashedPassword,
      nombre: 'Test Docs User',
      rolId: role.id,
      areaId: testArea.id,
      isActive: true
    });

    // Crear sender de prueba
    testSender = await Sender.findOne({ where: { nombreCompleto: 'Test Sender' } }) ||
                  await Sender.create({
                    nombreCompleto: 'Test Sender',
                    tipoDocumento: 'DNI',
                    numeroDocumento: '12345678',
                    email: 'sender@test.com'
                  });

    // Crear tipo de documento
    testDocType = await DocumentType.findOne({ where: { nombre: 'Oficio' } }) ||
                   await DocumentType.create({ nombre: 'Oficio', descripcion: 'Test' });

    // Crear estados
    testStatus = await DocumentStatus.findOne({ where: { nombre: 'Pendiente' } }) ||
                  await DocumentStatus.create({ nombre: 'Pendiente', color: '#FFA500' });

    // Generar token
    const payload = {
      userId: testUser.id,
      email: testUser.email,
      role: role.nombre
    };
    authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // Cleanup
  afterAll(async () => {
    if (testDocument) {
      await Document.destroy({ where: { id: testDocument.id } });
    }
    if (testUser) {
      await User.destroy({ where: { id: testUser.id } });
    }
  });

  describe('POST /api/documents', () => {
    it('debería crear un documento con datos válidos', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          senderId: testSender.id,
          documentTypeId: testDocType.id,
          asunto: 'Test Document Integration',
          descripcion: 'Test Description',
          prioridad: 'normal'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.trackingCode).toBeDefined();
      expect(response.body.data.asunto).toBe('Test Document Integration');

      // Guardar para otros tests
      testDocument = response.body.data;
    });

    it('debería rechazar creación sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Falta senderId y documentTypeId
          asunto: 'Incomplete Document'
        })
        .expect(500); // El servicio retorna 500 con el mensaje de error

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Faltan campos obligatorios');
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/documents')
        .send({
          senderId: testSender.id,
          documentTypeId: testDocType.id,
          asunto: 'Test'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documents', () => {
    it('debería listar documentos con autenticación', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debería filtrar documentos por búsqueda', async () => {
      const response = await request(app)
        .get('/api/documents?search=Test Document Integration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('debería obtener un documento por ID', async () => {
      if (!testDocument) {
        // Crear documento si no existe
        const doc = await Document.create({
          trackingCode: 'TEST-2024-999999',
          senderId: testSender.id,
          docTypeId: testDocType.id,
          statusId: testStatus.id,
          currentAreaId: testArea.id,
          currentUserId: testUser.id,
          asunto: 'Test Doc for GET',
          prioridad: 'normal'
        });
        testDocument = doc;
      }

      const response = await request(app)
        .get(`/api/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testDocument.id);
    });

    it('debería retornar 404 para documento inexistente', async () => {
      const response = await request(app)
        .get('/api/documents/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrado');
    });
  });

  describe('GET /api/documents/tracking/:code', () => {
    it('debería obtener documento por tracking code sin autenticación', async () => {
      if (!testDocument) {
        const doc = await Document.create({
          trackingCode: 'TEST-2024-888888',
          senderId: testSender.id,
          docTypeId: testDocType.id,
          statusId: testStatus.id,
          currentAreaId: testArea.id,
          asunto: 'Public Track Test',
          prioridad: 'normal'
        });
        testDocument = doc;
      }

      const response = await request(app)
        .get(`/api/documents/tracking/${testDocument.trackingCode}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.trackingCode).toBe(testDocument.trackingCode);
    });

    it('debería retornar 404 para código inexistente', async () => {
      const response = await request(app)
        .get('/api/documents/tracking/INVALID-CODE-12345')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('debería actualizar un documento', async () => {
      if (!testDocument) return;

      const response = await request(app)
        .put(`/api/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asunto: 'Updated Test Document',
          prioridad: 'alta'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.asunto).toBe('Updated Test Document');
      expect(response.body.data.prioridad).toBe('alta');
    });

    it('debería rechazar actualización sin autenticación', async () => {
      if (!testDocument) return;

      const response = await request(app)
        .put(`/api/documents/${testDocument.id}`)
        .send({
          asunto: 'Should fail'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/documents/:id/derive', () => {
    it('debería derivar documento a otra área', async () => {
      // Crear área destino
      const targetArea = await Area.findOne({ where: { nombre: 'Target Area' } }) ||
                          await Area.create({ nombre: 'Target Area', sigla: 'TGA' });

      if (!testDocument) return;

      const response = await request(app)
        .post(`/api/documents/${testDocument.id}/derive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toAreaId: targetArea.id,
          observacion: 'Derivando para prueba'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentAreaId).toBe(targetArea.id);
    });

    it('debería rechazar derivación sin toAreaId', async () => {
      if (!testDocument) return;

      const response = await request(app)
        .post(`/api/documents/${testDocument.id}/derive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          observacion: 'Missing toAreaId'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('toAreaId');
    });
  });

  describe('GET /api/documents/stats', () => {
    it('debería obtener estadísticas de documentos', async () => {
      const response = await request(app)
        .get('/api/documents/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.byPriority).toBeDefined();
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/documents/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
