const nodemailer = require('nodemailer');

/**
 * Servicio de Email
 * Maneja el envío de notificaciones por correo electrónico
 */
class EmailService {
  constructor() {
    // Configurar transporte de nodemailer
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializar transporte de email
   */
  initializeTransporter() {
    try {
      // Solo inicializar si las variables de entorno están configuradas
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.warn('⚠️  Email no configurado. Las notificaciones por email están deshabilitadas.');
        console.warn('   Configure EMAIL_HOST, EMAIL_USER y EMAIL_PASSWORD en .env para habilitar.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true para puerto 465, false para otros
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      console.log('✓ Servicio de email inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar servicio de email:', error.message);
    }
  }

  /**
   * Verificar si el servicio de email está disponible
   */
  isAvailable() {
    return this.transporter !== null;
  }

  /**
   * Enviar email
   * @param {String} to - Destinatario
   * @param {String} subject - Asunto
   * @param {String} html - Contenido HTML
   */
  async sendEmail(to, subject, html) {
    if (!this.isAvailable()) {
      console.log('Email no enviado (servicio no configurado):', { to, subject });
      return { success: false, message: 'Servicio de email no configurado' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || `"SGD Sistema" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });

      console.log('✓ Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar nuevo documento
   * @param {Object} user - Usuario destinatario
   * @param {Object} document - Documento
   */
  async notifyNewDocument(user, document) {
    const subject = `Nuevo Documento: ${document.asunto}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #1f2937; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Sistema de Gestión Documentaria</h2>
          </div>
          <div class="content">
            <h3>Nuevo Documento Recibido</h3>
            <p>Hola ${user.nombre},</p>
            <p>Se ha registrado un nuevo documento en el sistema:</p>
            
            <div class="info">
              <span class="label">Código de Seguimiento:</span> 
              <span class="value">${document.trackingCode}</span>
            </div>
            <div class="info">
              <span class="label">Asunto:</span> 
              <span class="value">${document.asunto}</span>
            </div>
            <div class="info">
              <span class="label">Prioridad:</span> 
              <span class="value">${document.prioridad.toUpperCase()}</span>
            </div>
            <div class="info">
              <span class="label">Remitente:</span> 
              <span class="value">${document.sender?.nombreCompleto || 'N/A'}</span>
            </div>
            
            <p>Por favor, revisa el documento en el sistema.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" class="button">
              Ver en el Sistema
            </a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Documentaria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Notificar derivación de documento
   * @param {Object} user - Usuario destinatario
   * @param {Object} document - Documento
   * @param {String} observacion - Observación de derivación
   */
  async notifyDocumentDerivation(user, document, observacion) {
    const subject = `Documento Derivado: ${document.asunto}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background: #fffbeb; padding: 20px; margin: 20px 0; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #78350f; }
          .value { color: #92400e; }
          .observation { background: white; padding: 10px; border-left: 3px solid #f59e0b; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Documento Derivado a Tu Área</h2>
          </div>
          <div class="content">
            <p>Hola ${user.nombre},</p>
            <p>Se ha derivado un documento a tu área:</p>
            
            <div class="info">
              <span class="label">Código:</span> 
              <span class="value">${document.trackingCode}</span>
            </div>
            <div class="info">
              <span class="label">Asunto:</span> 
              <span class="value">${document.asunto}</span>
            </div>
            <div class="info">
              <span class="label">Prioridad:</span> 
              <span class="value">${document.prioridad.toUpperCase()}</span>
            </div>
            
            ${observacion ? `
            <div class="observation">
              <strong>Observaciones:</strong><br>
              ${observacion}
            </div>
            ` : ''}
            
            <p>Por favor, revisa y atiende el documento lo antes posible.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" class="button">
              Ver Documento
            </a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Documentaria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Notificar finalización de documento
   * @param {Object} user - Usuario destinatario
   * @param {Object} document - Documento
   */
  async notifyDocumentFinalized(user, document) {
    const subject = `Documento Finalizado: ${document.asunto}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f0fdf4; padding: 20px; margin: 20px 0; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #065f46; }
          .value { color: #047857; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✓ Documento Finalizado</h2>
          </div>
          <div class="content">
            <p>Hola ${user.nombre},</p>
            <p>El siguiente documento ha sido finalizado:</p>
            
            <div class="info">
              <span class="label">Código:</span> 
              <span class="value">${document.trackingCode}</span>
            </div>
            <div class="info">
              <span class="label">Asunto:</span> 
              <span class="value">${document.asunto}</span>
            </div>
            
            <p>El trámite ha sido completado exitosamente.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" class="button">
              Ver Detalles
            </a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Documentaria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Notificar documento próximo a vencer
   * @param {Object} user - Usuario destinatario
   * @param {Object} document - Documento
   * @param {Number} daysRemaining - Días restantes
   */
  async notifyDocumentDeadline(user, document, daysRemaining) {
    const subject = `⚠️ Documento Próximo a Vencer: ${document.asunto}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #fef2f2; padding: 20px; margin: 20px 0; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #7f1d1d; }
          .value { color: #991b1b; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Documento Próximo a Vencer</h2>
          </div>
          <div class="content">
            <p>Hola ${user.nombre},</p>
            
            <div class="warning">
              <strong>⏰ Atención:</strong> El siguiente documento está próximo a vencer en <strong>${daysRemaining} día(s)</strong>.
            </div>
            
            <div class="info">
              <span class="label">Código:</span> 
              <span class="value">${document.trackingCode}</span>
            </div>
            <div class="info">
              <span class="label">Asunto:</span> 
              <span class="value">${document.asunto}</span>
            </div>
            <div class="info">
              <span class="label">Fecha Límite:</span> 
              <span class="value">${document.fechaLimite}</span>
            </div>
            
            <p>Por favor, atiende este documento con urgencia.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/dashboard" class="button">
              Atender Ahora
            </a>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión Documentaria</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();
