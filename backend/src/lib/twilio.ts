import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappSender = process.env.TWILIO_WHATSAPP_SENDER;
const smsSender = process.env.TWILIO_SMS_SENDER;

let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
  console.log('✓ Cliente Twilio configurado');
} else {
  console.warn('⚠️  Credenciais Twilio não configuradas. Mensagens WhatsApp/SMS não serão enviadas.');
  console.warn(`   AccountSid: ${accountSid ? 'presente' : 'ausente'}`);
  console.warn(`   AuthToken: ${authToken ? 'presente' : 'ausente'}`);
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  if (!client || !whatsappSender) {
    console.warn('⚠️  Cliente Twilio ou WhatsApp sender não configurado');
    throw new Error('Twilio não configurado');
  }

  try {
    // Garantir que o destinatário tenha prefixo whatsapp:
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: whatsappSender,
      to: formattedTo,
      body: message
    });

    console.log('✓ WhatsApp enviado:', result.sid);
  } catch (error) {
    console.error('✗ Erro ao enviar WhatsApp:', error);
    throw error;
  }
}

export async function sendSMSMessage(to: string, message: string): Promise<void> {
  if (!client || !smsSender) {
    console.warn('⚠️  Cliente Twilio ou SMS sender não configurado');
    throw new Error('Twilio SMS não configurado');
  }

  try {
    // Remove prefixo whatsapp: se existir (para SMS)
    const formattedTo = to.replace('whatsapp:', '');

    const result = await client.messages.create({
      from: smsSender,
      to: formattedTo,
      body: message
    });

    console.log('✓ SMS enviado:', result.sid);
  } catch (error) {
    console.error('✗ Erro ao enviar SMS:', error);
    throw error;
  }
}
