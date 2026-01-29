import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true para 465, false para outras portas
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  console.log('✓ Transporter de email configurado');
} else {
  console.warn('⚠️  Credenciais SMTP não configuradas. Emails não serão enviados.');
  console.warn(`   SMTP_HOST: ${smtpHost || 'ausente'}`);
  console.warn(`   SMTP_USER: ${smtpUser || 'ausente'}`);
  console.warn(`   SMTP_PASS: ${smtpPass ? 'presente' : 'ausente'}`);
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!transporter) {
    console.warn('⚠️  Transporter de email não configurado');
    throw new Error('Email transporter não configurado');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Global Call Partners" <${smtpUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log('✓ Email enviado:', info.messageId);
  } catch (error) {
    console.error('✗ Erro ao enviar email:', error);
    throw error;
  }
}
