const { sequelize, testConnection } = require('../config/sequelize');
const { Area, DocumentStatus, DocumentType, AreaDocumentCategory, Sender, Document, DocumentMovement } = require('../models');

// Simple random helpers (no external deps)
const surnames = ['García','Rodríguez','Pérez','López','Martínez','Sánchez','González','Torres','Flores','Ramos'];
const names = ['Juan','María','Luis','Ana','Carlos','Lucía','Miguel','Elena','José','Mariana'];
const subjects = ['Solicitud', 'Requerimiento', 'Oficio', 'Informe', 'Notificación', 'Reclamo', 'Consulta'];
const departments = ['Lima','Cusco','Arequipa','Piura','La Libertad'];
const provinces = ['Lima','Cusco','Arequipa','Piura','Trujillo'];
const districts = ['Miraflores','San Isidro','San Borja','Cercado','Barranco'];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pad(num, size) { let s = String(num); while (s.length < size) s = '0' + s; return s; }

function randomDateWithinDays(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.floor(Math.random() * daysBack) * 24 * 60 * 60 * 1000);
  // random time during day
  past.setHours(randInt(8, 17), randInt(0,59), randInt(0,59));
  return past;
}

async function generate({ count = 100, areaId = null }) {
  await testConnection();

  // Read lookup tables
  const areas = await Area.findAll();
  if (areas.length === 0) {
    console.error('No hay áreas en la base de datos. Crea áreas antes.');
    process.exit(1);
  }

  const statuses = await DocumentStatus.findAll();
  if (statuses.length === 0) {
    console.error('No hay estados de documento en la base de datos.');
    process.exit(1);
  }

  const docTypes = await DocumentType.findAll();
  const categoriesByArea = {};
  for (const a of areas) {
    const cats = await AreaDocumentCategory.findAll({ where: { areaId: a.id } });
    categoriesByArea[a.id] = cats;
  }

  const targetAreas = areaId ? areas.filter(a => a.id === Number(areaId)) : areas;

  // Detectar columnas reales en la tabla documents (evitar atributos de modelo que no existan en BD)
  const [colsRows] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents'");
  const docColumns = colsRows.map(r => r.COLUMN_NAME);
  const hasDocTypeColumn = docColumns.includes('doc_type_id');
  const hasCategoriaColumn = docColumns.includes('categoria_id');

  console.log(`Generando ${count} documentos en ${targetAreas.length} áreas...`);

  let created = 0;
  for (let i = 0; i < count; i++) {
    const area = pick(targetAreas);
    const status = pick(statuses);
    const docType = docTypes.length > 0 && Math.random() > 0.3 ? pick(docTypes) : null;
    const cats = categoriesByArea[area.id] || [];
    const category = cats.length > 0 && Math.random() > 0.6 ? pick(cats) : null;

    // Create sender
    const isNatural = Math.random() < 0.7;
    let senderPayload = { email: null, telefono: null };
    if (isNatural) {
      const nombre = pick(names) + (Math.random()<0.4? ' ' + pick(names): '');
      const ap = pick(surnames);
      const am = pick(surnames);
      const tipoDocumento = Math.random() < 0.9 ? 'DNI' : 'CE';
      senderPayload = {
        tipoPersona: 'natural',
        tipoDocumento: tipoDocumento,
        numeroDocumento: pad(randInt(10000000, 99999999), 8),
        nombres: nombre,
        apellidoPaterno: ap,
        apellidoMaterno: am,
        nombreCompleto: `${nombre} ${ap} ${am}`,
        email: `${nombre.replace(/ /g,'').toLowerCase()}.${ap.toLowerCase()}@example.com`,
        telefono: `9${pad(randInt(10000000,99999999),8)}`,
        departamento: pick(departments),
        provincia: pick(provinces),
        distrito: pick(districts),
        direccionCompleta: `${randInt(1,9999)} ${pick(['Av.','Jr.','Calle'])} ${pick(['Los', 'El', 'San', 'Santa'])} ${pick(surnames)}`
      };
    } else {
      const ruc = pad(randInt(10000000000, 99999999999), 11);
      const empresa = `Empresa ${pad(randInt(1,9999),4)}`;
      const repNombre = pick(names) + (Math.random()<0.3? ' ' + pick(names): '');
      const repAp = pick(surnames);
      const repAm = pick(surnames);
      senderPayload = {
        tipoPersona: 'juridica',
        ruc,
        nombreEmpresa: empresa,
        representanteTipoDoc: 'DNI',
        representanteNumDoc: pad(randInt(10000000,99999999),8),
        representanteNombres: repNombre,
        representanteApellidoPaterno: repAp,
        representanteApellidoMaterno: repAm,
        email: `contacto@${empresa.replace(/\s+/g,'').toLowerCase()}.com`,
        telefono: `1${pad(randInt(1000000,9999999),7)}`,
        departamento: pick(departments),
        provincia: pick(provinces),
        distrito: pick(districts),
        direccionCompleta: `${randInt(1,9999)} ${pick(['Av.','Jr.','Calle'])} ${pick(['Principal', 'Central', 'Industrial'])}`
      };
    }

    const sender = await Sender.create(senderPayload);

    // Create document
    const now = new Date();
    const yyyy = now.getFullYear();
    const trackingCode = `SGD-${yyyy}-${pad(Date.now() % 1000000, 6)}-${pad(i,4)}`;

    const fechaRecepcion = randomDateWithinDays(60);

    const docPayload = {
      trackingCode,
      asunto: `${pick(subjects)} de prueba ${i+1}`,
      descripcion: `Documento generado automáticamente para pruebas (índice ${i+1})`,
      senderId: sender.id,
      statusId: status.id,
      currentAreaId: area.id,
      currentUserId: null,
      fechaLimite: null,
      fechaRecepcion
    };

    // Agregar campos opcionales sólo si la columna existe en la BD
    if (hasDocTypeColumn) {
      docPayload.docTypeId = docType ? docType.id : null;
    }
    if (hasCategoriaColumn) {
      docPayload.categoriaId = category ? category.id : null;
    }

    const document = await Document.create(docPayload);

    // Create initial movement
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: null,
      toAreaId: area.id,
      userId: null,
      accion: 'Recepción',
      observacion: 'Generado automáticamente para pruebas',
      timestamp: fechaRecepcion
    });

    created++;
    if (created % 20 === 0) process.stdout.write(`.${created}`);
  }

  console.log(`\n✅ Generación completada: ${created} documentos creados.`);
  process.exit(0);
}

// CLI parsing simple (no deps)
const rawArgs = process.argv.slice(2);
let count = 100;
let areaId = null;
for (const a of rawArgs) {
  if (a.startsWith('--count=')) {
    const v = Number(a.split('=')[1]);
    if (!Number.isNaN(v) && v > 0) count = v;
  }
  if (a.startsWith('--area=')) {
    const v = a.split('=')[1];
    if (v) areaId = v;
  }
}

generate({ count, areaId }).catch(err => {
  console.error('Error generando datos:', err);
  process.exit(1);
});
