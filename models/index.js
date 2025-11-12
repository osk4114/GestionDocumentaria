const { sequelize } = require('../config/sequelize');

// Importar todos los modelos
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Area = require('./Area');
const User = require('./User');
const Sender = require('./Sender');
const DocumentType = require('./DocumentType');
const DocumentStatus = require('./DocumentStatus');
const Document = require('./Document');
const DocumentMovement = require('./DocumentMovement');
const Attachment = require('./Attachment');
const AreaDocumentCategory = require('./AreaDocumentCategory');
const DocumentVersion = require('./DocumentVersion');

// Inicializar modelos que son funciones
const UserSession = require('./UserSession')(sequelize);
const LoginAttempt = require('./LoginAttempt')(sequelize);

// ============================================================
// Definir relaciones entre modelos
// ============================================================

// -------- RELACIONES DE ROLE Y PERMISSIONS --------
// Relación muchos a muchos entre Role y Permission
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'rol_id',
  otherKey: 'permission_id',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'rol_id',
  as: 'roles'
});

// RolePermission pertenece a Role
RolePermission.belongsTo(Role, {
  foreignKey: 'rol_id',
  as: 'role'
});
Role.hasMany(RolePermission, {
  foreignKey: 'rol_id',
  as: 'rolePermissions'
});

// RolePermission pertenece a Permission
RolePermission.belongsTo(Permission, {
  foreignKey: 'permission_id',
  as: 'permission'
});
Permission.hasMany(RolePermission, {
  foreignKey: 'permission_id',
  as: 'permissionRoles'
});

// RolePermission asignado por un User
RolePermission.belongsTo(User, {
  foreignKey: 'asignado_por',
  as: 'assignedBy'
});
User.hasMany(RolePermission, {
  foreignKey: 'asignado_por',
  as: 'assignedPermissions'
});

// -------- RELACIONES DE USER --------
// User pertenece a un Role
User.belongsTo(Role, {
  foreignKey: 'rolId',
  as: 'role'
});
Role.hasMany(User, {
  foreignKey: 'rolId',
  as: 'users'
});

// User tiene muchas sesiones
User.hasMany(UserSession, {
  foreignKey: 'userId',
  as: 'sessions'
});
UserSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User pertenece a un Area
User.belongsTo(Area, {
  foreignKey: 'areaId',
  as: 'area'
});
Area.hasMany(User, {
  foreignKey: 'areaId',
  as: 'users'
});

// -------- RELACIONES DE DOCUMENT --------
// Document pertenece a un Sender
Document.belongsTo(Sender, {
  foreignKey: 'senderId',
  as: 'sender'
});
Sender.hasMany(Document, {
  foreignKey: 'senderId',
  as: 'documents'
});

// Document pertenece a un DocumentType
Document.belongsTo(DocumentType, {
  foreignKey: 'docTypeId',
  as: 'documentType'
});
DocumentType.hasMany(Document, {
  foreignKey: 'docTypeId',
  as: 'documents'
});

// Document pertenece a un DocumentStatus
Document.belongsTo(DocumentStatus, {
  foreignKey: 'statusId',
  as: 'status'
});
DocumentStatus.hasMany(Document, {
  foreignKey: 'statusId',
  as: 'documents'
});

// Document pertenece a un Area (current area)
Document.belongsTo(Area, {
  foreignKey: 'currentAreaId',
  as: 'currentArea'
});
Area.hasMany(Document, {
  foreignKey: 'currentAreaId',
  as: 'currentDocuments'
});

// Document pertenece a un User (current user)
Document.belongsTo(User, {
  foreignKey: 'currentUserId',
  as: 'currentUser'
});
User.hasMany(Document, {
  foreignKey: 'currentUserId',
  as: 'assignedDocuments'
});

// -------- RELACIONES DE DOCUMENT_MOVEMENT --------
// DocumentMovement pertenece a un Document
DocumentMovement.belongsTo(Document, {
  foreignKey: 'documentId',
  as: 'document'
});
Document.hasMany(DocumentMovement, {
  foreignKey: 'documentId',
  as: 'movements'
});

// DocumentMovement tiene from_area y to_area
DocumentMovement.belongsTo(Area, {
  foreignKey: 'fromAreaId',
  as: 'fromArea'
});
DocumentMovement.belongsTo(Area, {
  foreignKey: 'toAreaId',
  as: 'toArea'
});

// DocumentMovement pertenece a un User
DocumentMovement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
User.hasMany(DocumentMovement, {
  foreignKey: 'userId',
  as: 'movements'
});

// -------- RELACIONES DE ATTACHMENT --------
// Attachment pertenece a un Document
Attachment.belongsTo(Document, {
  foreignKey: 'documentId',
  as: 'document'
});
Document.hasMany(Attachment, {
  foreignKey: 'documentId',
  as: 'attachments'
});

// Attachment subido por un User
Attachment.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploader'
});
User.hasMany(Attachment, {
  foreignKey: 'uploadedBy',
  as: 'uploadedFiles'
});

// -------- RELACIONES DE AREA_DOCUMENT_CATEGORY --------
// AreaDocumentCategory pertenece a un Area
AreaDocumentCategory.belongsTo(Area, {
  foreignKey: 'areaId',
  as: 'area'
});
Area.hasMany(AreaDocumentCategory, {
  foreignKey: 'areaId',
  as: 'categories'
});

// AreaDocumentCategory creada por un User
AreaDocumentCategory.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});
User.hasMany(AreaDocumentCategory, {
  foreignKey: 'createdBy',
  as: 'createdCategories'
});

// Document pertenece a una AreaDocumentCategory
Document.belongsTo(AreaDocumentCategory, {
  foreignKey: 'categoriaId',
  as: 'categoria'
});
AreaDocumentCategory.hasMany(Document, {
  foreignKey: 'categoriaId',
  as: 'documents'
});

// -------- RELACIONES DE DOCUMENT_VERSION --------
// DocumentVersion pertenece a un Document
DocumentVersion.belongsTo(Document, {
  foreignKey: 'documentId',
  as: 'document'
});
Document.hasMany(DocumentVersion, {
  foreignKey: 'documentId',
  as: 'versions'
});

// DocumentVersion subida por un User
DocumentVersion.belongsTo(User, {
  foreignKey: 'uploadedBy',
  as: 'uploader'
});
User.hasMany(DocumentVersion, {
  foreignKey: 'uploadedBy',
  as: 'uploadedVersions'
});

// DocumentVersion pertenece a un Area
DocumentVersion.belongsTo(Area, {
  foreignKey: 'areaId',
  as: 'area'
});
Area.hasMany(DocumentVersion, {
  foreignKey: 'areaId',
  as: 'documentVersions'
});

// ============================================================
// Función para sincronizar modelos con la base de datos
// ============================================================
const syncDatabase = async (force = false) => {
  try {
    // IMPORTANTE: No usar sync en producción, usar migraciones
    // force: false = no elimina tablas existentes (las tablas ya fueron creadas por SQL)
    await sequelize.sync({ force, alter: false });
    console.log('✓ Modelos de Sequelize sincronizados con la base de datos');
  } catch (error) {
    console.error('✗ Error al sincronizar modelos:', error.message);
    throw error;
  }
};

// ============================================================
// Exportar todos los modelos y funciones
// ============================================================
module.exports = {
  sequelize,
  Role,
  Permission,
  RolePermission,
  Area,
  User,
  Sender,
  DocumentType,
  DocumentStatus,
  Document,
  DocumentMovement,
  Attachment,
  UserSession,
  LoginAttempt,
  AreaDocumentCategory,
  DocumentVersion,
  syncDatabase
};
