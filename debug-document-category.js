const { Document, AreaDocumentCategory } = require('./models');

async function checkDocument() {
  try {
    const doc = await Document.findOne({
      where: { trackingCode: 'SGD-2025-142744' },
      include: [
        { 
          model: AreaDocumentCategory, 
          as: 'categoria',
          required: false
        }
      ]
    });

    console.log('Documento encontrado:');
    console.log(JSON.stringify(doc, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDocument();
