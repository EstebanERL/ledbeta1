import nodemailer from 'nodemailer';

/**
 * Servicio de correo para TalentForge.
 * Configurable via .env del backend:
 *   SMTP_HOST=smtp-relay.brevo.com  (o sendgrid/mailgun/gmail)
 *   SMTP_PORT=587
 *   SMTP_SECURE=false               (true para 465)
 *   SMTP_USER=...
 *   SMTP_PASS=...
 *   MAIL_FROM="TalentForge <no-reply@talentforge.com>"
 *   APP_URL=https://app.talentforge.com   (para enlaces en correos)
 *
 * Si no hay credenciales SMTP el sistema entra en modo dev: solo registra el correo en consola
 * y no rompe el flujo (útil mientras se configuran las credenciales).
 */

let _transporter = null;
function getTransporter() {
  console.log("SMTP_HOST =", process.env.SMTP_HOST);
  console.log("SMTP_USER =", process.env.SMTP_USER);
  console.log("SMTP_PASS =", process.env.SMTP_PASS ? "CONFIGURADO" : "VACIO");
  if (_transporter !== null) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[email] SMTP no configurado — los correos se registrarán en consola únicamente.');
    _transporter = false; // sentinel
        return false;
      }
      _transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
          rejectUnauthorized: false,
        },
      });

console.log("[EMAIL] Transporter creado correctamente");

return _transporter;
}

const FROM = process.env.MAIL_FROM || 'TalentForge <no-reply@talentforge.local>';
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

function baseLayout({ title, intro, ctaText, ctaUrl, body, footer }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);padding:24px 32px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.18);display:inline-block;text-align:center;line-height:36px;color:#fff;font-weight:700;">TF</div>
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.3px;">TalentForge</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px 32px 8px 32px;">
          <h1 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">${escape(title)}</h1>
          ${intro ? `<p style="margin:0 0 14px 0;line-height:1.55;color:#334155;">${intro}</p>` : ''}
          ${body || ''}
          ${ctaText && ctaUrl ? `
            <p style="margin:22px 0;">
              <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">${escape(ctaText)}</a>
            </p>
            <p style="font-size:12px;color:#64748b;margin:0 0 12px 0;">Si el botón no funciona, copia este enlace:<br/><span style="word-break:break-all;color:#475569;">${ctaUrl}</span></p>
          ` : ''}
        </td></tr>
        <tr><td style="padding:18px 32px 28px 32px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5;">
          ${footer || 'Este correo se envió automáticamente desde TalentForge. Si no esperabas recibirlo, puedes ignorarlo.'}
        </td></tr>
      </table>
      <p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} TalentForge — Plataforma corporativa de talento.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

export async function sendMail({ to, subject, html, text }) {
  console.log("[EMAIL] Intentando enviar correo a:", to);
  if (!to) return { skipped: true };
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev] → ${to}\n  Subject: ${subject}`);
    return { skipped: true };
  }
  try {
        console.log("[SMTP] Verificando conexión...");
    t.verify((err, success) => {
      if (err) {
        console.error("[SMTP VERIFY ERROR]", err);
      } else {
        console.log("[SMTP VERIFY OK]", success);
      }
    });
    const info = await t.sendMail({ from: FROM, to, subject, html, text: text || stripHtml(html) });
    console.log("[EMAIL OK]", info);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] Error enviando a ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

function stripHtml(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

// ====== Plantillas ======

export function tplWelcome({ fullName }) {
  return {
    subject: 'Bienvenido/a a TalentForge',
    html: baseLayout({
      title: `Hola ${escape(fullName)}, bienvenido/a 👋`,
      intro: 'Tu cuenta ha sido creada exitosamente. Desde tu panel podrás postularte a vacantes, completar evaluaciones y dar seguimiento a tus procesos.',
      ctaText: 'Ir a mi panel',
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  };
}

export function tplPasswordReset({ fullName, resetUrl }) {
  return {
    subject: 'Restablecer tu contraseña en TalentForge',
    html: baseLayout({
      title: 'Solicitud para restablecer tu contraseña',
      intro: `Hola ${escape(fullName || '')}. Recibimos una solicitud para restablecer la contraseña de tu cuenta. Este enlace es válido por <strong>60 minutos</strong> y solo puede usarse una vez.`,
      ctaText: 'Crear nueva contraseña',
      ctaUrl: resetUrl,
      footer: 'Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá intacta.',
    }),
  };
}

export function tplPostulacionRecibida({ fullName, vacanteTitulo }) {
  return {
    subject: `Hemos recibido tu postulación: ${vacanteTitulo}`,
    html: baseLayout({
      title: 'Postulación registrada',
      intro: `Hola ${escape(fullName)}, recibimos tu postulación a <strong>${escape(vacanteTitulo)}</strong>. Nuestro equipo iniciará la revisión en breve y te mantendremos informado/a por correo.`,
      ctaText: 'Ver mis postulaciones',
      ctaUrl: `${APP_URL}/postulaciones`,
    }),
  };
}

const ESTADO_ASUNTO = {
  en_revision: 'Tu postulación está en revisión',
  test_asignado: 'Se te ha asignado un test',
  test_completado: 'Hemos recibido tu test',
  entrevista_pendiente: 'Has sido convocado/a a entrevista',
  entrevista_realizada: 'Entrevista registrada',
  contratada: '¡Felicidades! Has sido contratado/a',
  rechazada: 'Resultado de tu proceso',
};
const ESTADO_TEXTO = {
  en_revision: 'Tu postulación pasó a revisión por el equipo de selección. Te avisaremos cuando avance.',
  test_asignado: 'Se te asignó un nuevo test dentro de tu proceso. Ingresa a la plataforma para completarlo.',
  test_completado: 'Recibimos tus respuestas y serán evaluadas por nuestro equipo.',
  entrevista_pendiente: 'Has avanzado a la etapa de entrevista. Pronto recibirás los detalles de la programación.',
  entrevista_realizada: 'Tu entrevista quedó registrada. Estamos analizando los resultados.',
  contratada: '¡Felicitaciones! Has sido seleccionado/a. Nuestro equipo de RRHH te contactará con los siguientes pasos.',
  rechazada: 'Te informamos que tu proceso ha concluido para esta vacante. Agradecemos tu interés y te invitamos a postularte a futuras oportunidades.',
};

export function tplCambioEstado({ fullName, vacanteTitulo, estado, nota }) {
  const subject = ESTADO_ASUNTO[estado] || `Actualización de tu proceso: ${vacanteTitulo}`;
  const intro = ESTADO_TEXTO[estado] || 'Tu proceso ha sido actualizado.';
  return {
    subject,
    html: baseLayout({
      title: subject,
      intro: `Hola ${escape(fullName)}, ${intro}`,
      body: `
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;margin:8px 0;">
          <tr><td style="padding:12px 14px;"><span style="color:#64748b;font-size:12px;">Vacante</span><br/><strong>${escape(vacanteTitulo)}</strong></td></tr>
          ${nota ? `<tr><td style="padding:0 14px 12px 14px;color:#475569;font-size:13px;">${escape(nota)}</td></tr>` : ''}
        </table>`,
      ctaText: 'Ver el proceso',
      ctaUrl: `${APP_URL}/postulaciones`,
    }),
  };
}

export function tplEntrevista({ fullName, vacanteTitulo, fechaISO, modalidad, link, ubicacion, notas }) {
  const fecha = new Date(fechaISO).toLocaleString();
  return {
    subject: `Entrevista programada para ${vacanteTitulo}`,
    html: baseLayout({
      title: 'Tienes una entrevista programada',
      intro: `Hola ${escape(fullName)}, se programó una entrevista <strong>${escape(modalidad)}</strong> dentro de tu proceso.`,
      body: `
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;margin:10px 0;">
          <tr><td style="padding:12px 14px;"><span style="color:#64748b;font-size:12px;">Vacante</span><br/><strong>${escape(vacanteTitulo)}</strong></td></tr>
          <tr><td style="padding:0 14px 8px 14px;"><span style="color:#64748b;font-size:12px;">Fecha y hora</span><br/><strong>${escape(fecha)}</strong></td></tr>
          ${link ? `<tr><td style="padding:0 14px 8px 14px;"><span style="color:#64748b;font-size:12px;">Enlace</span><br/><a href="${link}">${escape(link)}</a></td></tr>` : ''}
          ${ubicacion ? `<tr><td style="padding:0 14px 8px 14px;"><span style="color:#64748b;font-size:12px;">Ubicación</span><br/>${escape(ubicacion)}</td></tr>` : ''}
          ${notas ? `<tr><td style="padding:0 14px 12px 14px;color:#475569;font-size:13px;"><em>${escape(notas)}</em></td></tr>` : ''}
        </table>`,
      ctaText: 'Ver mis procesos',
      ctaUrl: `${APP_URL}/postulaciones`,
    }),
  };
}

export function tplTestAsignado({ fullName, testTitulo, vacanteTitulo, instrucciones }) {
  return {
    subject: `Nuevo test asignado: ${testTitulo}`,
    html: baseLayout({
      title: 'Tienes un nuevo test asignado',
      intro: `Hola ${escape(fullName)}, se te asignó el test <strong>${escape(testTitulo)}</strong>${vacanteTitulo ? ` dentro de tu postulación a <strong>${escape(vacanteTitulo)}</strong>` : ''}.`,
      body: instrucciones
        ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;color:#475569;font-size:13px;">${escape(instrucciones)}</div>`
        : '',
      ctaText: 'Realizar test ahora',
      ctaUrl: `${APP_URL}/mis-tests`,
    }),
  };
}
