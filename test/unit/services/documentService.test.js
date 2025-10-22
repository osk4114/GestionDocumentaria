/**
 * Tests unitarios para documentService
 */

const documentService = require('../../../services/documentService');
const { Document, DocumentStatus, DocumentMovement, Area, User, Attachment, Notification } = require('../../../models');
const { sequelize } = require('../../../config/sequelize');

// Mock de los modelos
jest.mock('../../../models');
jest.mock('../../../config/sequelize');

describe('DocumentService', () => {
  
  // Limpiar mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTrackingCode', () => {
    it('debería generar un código de seguimiento único', async () => {
      // Mock: primera vez existe, segunda vez no existe
      Document.findOne = jest.fn()
        .mockResolvedValueOnce({ id: 1 }) // Existe
        .mockResolvedValueOnce(null); // No existe

      const code = await documentService.generateTrackingCode();

      expect(code).toMatch(/^SGD-\d{4}-\d{6}$/);
      expect(Document.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('createNewDocument', () => {
    it('debería crear un documento exitosamente', async () => {
      // Datos de prueba
      const mockData = {
        senderId: 1,
        documentTypeId: 2,
        asunto: 'Test Document',
        descripcion: 'Test Description',
        prioridad: 'normal'
      };

      const mockUser = {
        id: 1,
        areaId: 1,
        nombre: 'Test User'
      };

      // Mock de transacción
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      // Mock de búsqueda de estado
      DocumentStatus.findOne = jest.fn().mockResolvedValue({
        id: 1,
        nombre: 'Pendiente'
      });

      // Mock de creación de documento
      const mockDocument = {
        id: 1,
        trackingCode: 'SGD-2024-123456',
        ...mockData
      };
      Document.create = jest.fn().mockResolvedValue(mockDocument);

      // Mock de creación de movimiento
      DocumentMovement.create = jest.fn().mockResolvedValue({});

      // Mock de findByPk con relaciones
      Document.findByPk = jest.fn().mockResolvedValue({
        ...mockDocument,
        sender: {},
        documentType: {},
        status: {},
        currentArea: {},
        currentUser: {}
      });

      // Mock de findOne para tracking code único
      Document.findOne = jest.fn().mockResolvedValue(null);

      // Mock de usuarios del área
      User.findAll = jest.fn().mockResolvedValue([]);

      // Ejecutar
      const result = await documentService.createNewDocument(mockData, mockUser);

      // Verificar
      expect(result).toBeDefined();
      expect(result.trackingCode).toBeDefined();
      expect(Document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockData.senderId,
          asunto: mockData.asunto
        }),
        expect.any(Object)
      );
      expect(DocumentMovement.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('debería hacer rollback si falla la creación', async () => {
      const mockData = {
        senderId: 1,
        documentTypeId: 2,
        asunto: 'Test'
      };

      const mockUser = { id: 1, areaId: 1 };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      // Mock que falla
      Document.create = jest.fn().mockRejectedValue(new Error('Database error'));
      Document.findOne = jest.fn().mockResolvedValue(null);
      DocumentStatus.findOne = jest.fn().mockResolvedValue({ id: 1 });

      // Ejecutar y verificar error
      await expect(
        documentService.createNewDocument(mockData, mockUser)
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('debería lanzar error si faltan campos requeridos', async () => {
      const mockData = {
        // Falta senderId y documentTypeId
        asunto: 'Test'
      };

      const mockUser = { id: 1, areaId: 1 };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      await expect(
        documentService.createNewDocument(mockData, mockUser)
      ).rejects.toThrow('Faltan campos obligatorios');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deriveDocument', () => {
    it('debería derivar un documento correctamente', async () => {
      const mockDocument = {
        id: 1,
        trackingCode: 'SGD-2024-123456',
        asunto: 'Test',
        currentAreaId: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        id: 1,
        areaId: 1,
        role: { nombre: 'Funcionario' }
      };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      Document.findByPk = jest.fn()
        .mockResolvedValueOnce(mockDocument) // Primera llamada en método
        .mockResolvedValueOnce({ // Segunda llamada para retornar con relaciones
          ...mockDocument,
          sender: {},
          documentType: {},
          status: {},
          currentArea: {},
          currentUser: {}
        });

      DocumentStatus.findOne = jest.fn().mockResolvedValue({
        id: 2,
        nombre: 'En proceso'
      });

      DocumentMovement.create = jest.fn().mockResolvedValue({});
      User.findAll = jest.fn().mockResolvedValue([{ id: 2 }]);
      Notification.create = jest.fn().mockResolvedValue({});

      const result = await documentService.deriveDocument(
        1, // documentId
        2, // toAreaId
        null, // toUserId
        'Test derivación',
        mockUser,
        'alta' // prioridad
      );

      expect(result).toBeDefined();
      expect(mockDocument.update).toHaveBeenCalled();
      expect(DocumentMovement.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('debería rechazar derivación a la misma área', async () => {
      const mockDocument = {
        id: 1,
        currentAreaId: 1
      };

      const mockUser = {
        id: 1,
        areaId: 1
      };

      const mockTransaction = {
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      Document.findByPk = jest.fn().mockResolvedValue(mockDocument);

      await expect(
        documentService.deriveDocument(1, 1, null, 'test', mockUser)
      ).rejects.toThrow('No puedes derivar un documento a la misma área');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('debería rechazar si el usuario no tiene permisos', async () => {
      const mockDocument = {
        id: 1,
        currentAreaId: 2 // Diferente del área del usuario
      };

      const mockUser = {
        id: 1,
        areaId: 1,
        role: { nombre: 'Funcionario' } // No es admin
      };

      const mockTransaction = {
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      Document.findByPk = jest.fn().mockResolvedValue(mockDocument);

      await expect(
        documentService.deriveDocument(1, 3, null, 'test', mockUser)
      ).rejects.toThrow('El documento no está en tu área');
    });
  });

  describe('finalizeDocument', () => {
    it('debería finalizar un documento correctamente', async () => {
      const mockDocument = {
        id: 1,
        asunto: 'Test',
        currentAreaId: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        id: 1,
        areaId: 1,
        role: { nombre: 'Funcionario' }
      };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      Document.findByPk = jest.fn()
        .mockResolvedValueOnce(mockDocument)
        .mockResolvedValueOnce({
          ...mockDocument,
          sender: {},
          documentType: {},
          status: { nombre: 'Finalizado' },
          currentArea: {},
          currentUser: {}
        });

      DocumentStatus.findOne = jest.fn().mockResolvedValue({
        id: 3,
        nombre: 'Finalizado'
      });

      DocumentMovement.create = jest.fn().mockResolvedValue({});
      User.findAll = jest.fn().mockResolvedValue([]);
      Notification.create = jest.fn().mockResolvedValue({});

      const result = await documentService.finalizeDocument(
        1,
        'Documento atendido',
        mockUser
      );

      expect(result).toBeDefined();
      expect(mockDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({ statusId: 3 }),
        expect.any(Object)
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('getDocumentByTrackingCode', () => {
    it('debería obtener un documento por tracking code', async () => {
      const mockDocument = {
        id: 1,
        trackingCode: 'SGD-2024-123456',
        asunto: 'Test',
        sender: {},
        documentType: {},
        status: {},
        movements: []
      };

      Document.findOne = jest.fn().mockResolvedValue(mockDocument);

      const result = await documentService.getDocumentByTrackingCode('SGD-2024-123456');

      expect(result).toBeDefined();
      expect(result.trackingCode).toBe('SGD-2024-123456');
      expect(Document.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { trackingCode: 'SGD-2024-123456' }
        })
      );
    });

    it('debería lanzar error si no encuentra el documento', async () => {
      Document.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        documentService.getDocumentByTrackingCode('INVALID-CODE')
      ).rejects.toThrow('Documento no encontrado');
    });
  });

  describe('getDocumentStats', () => {
    it('debería retornar estadísticas de documentos', async () => {
      Document.count = jest.fn().mockResolvedValue(10);
      Document.findAll = jest.fn().mockResolvedValue([
        { statusId: 1, status: { nombre: 'Pendiente' } },
        { statusId: 2, status: { nombre: 'En proceso' } }
      ]);

      const result = await documentService.getDocumentStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(10);
      expect(result.byStatus).toBeDefined();
      expect(result.byPriority).toBeDefined();
    });
  });

  describe('archiveDocument', () => {
    it('debería archivar un documento si el usuario es admin', async () => {
      const mockDocument = {
        id: 1,
        currentAreaId: 1,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        id: 1,
        role: { nombre: 'Administrador' }
      };

      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      Document.findByPk = jest.fn().mockResolvedValue(mockDocument);
      DocumentStatus.findOne = jest.fn().mockResolvedValue({
        id: 4,
        nombre: 'Archivado'
      });
      DocumentMovement.create = jest.fn().mockResolvedValue({});

      const result = await documentService.archiveDocument(1, mockUser);

      expect(result.success).toBe(true);
      expect(mockDocument.update).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('debería rechazar si el usuario no es admin', async () => {
      const mockDocument = { id: 1 };
      const mockUser = {
        id: 1,
        role: { nombre: 'Funcionario' }
      };

      const mockTransaction = {
        rollback: jest.fn()
      };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      Document.findByPk = jest.fn().mockResolvedValue(mockDocument);

      await expect(
        documentService.archiveDocument(1, mockUser)
      ).rejects.toThrow('Solo administradores pueden archivar documentos');
    });
  });
});
