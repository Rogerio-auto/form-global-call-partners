import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de importar outros módulos
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { store, OnboardingData } from './store';
import { sendWhatsAppMessage, sendSMSMessage } from './lib/twilio';
import { sendEmail } from './lib/mail';
import { getAgents, getAgentById } from './lib/supabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Helper para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper para detectar base URL
function getBaseUrl(req: Request): string {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

// Validação de telefone E.164
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// GET /api/agents - Buscar agentes do Supabase
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await getAgents();
    res.json({ success: true, agents });
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agentes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/submit - Submeter formulário de onboarding
app.post('/api/submit', async (req: Request, res: Response) => {
  try {
    const {
      name,
      owner_name,
      owner_phone,
      owner_email,
      target_country,
      base_agent,
      street,
      timezone,
      area_code
    } = req.body;

    // Validações básicas
    if (!name || !owner_name || !owner_phone || !owner_email || !target_country || !base_agent || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
        details: 'name, owner_name, owner_phone, owner_email, target_country, base_agent e timezone são obrigatórios'
      });
    }

    if (!isValidE164(owner_phone)) {
      return res.status(400).json({
        success: false,
        message: 'Telefone inválido',
        details: 'O telefone deve estar no formato E.164 (ex: +5511999999999)'
      });
    }

    // Buscar dados do agente (id_millis)
    let agentIdMillis = base_agent;
    try {
      const agent = await getAgentById(base_agent);
      if (agent) {
        agentIdMillis = agent.id_millis;
      }
    } catch (error) {
      console.warn('Erro ao buscar agente, usando ID fornecido:', error);
    }

    // Gerar slug
    const slug = generateSlug(name);

    // Verificar duplicidade (idempotência)
    const existing = store.findByEmailOrSlug(owner_email, slug);
    if (existing) {
      const baseUrl = getBaseUrl(req);
      const integrateLink = `${baseUrl}/connect?token=${existing.token}`;
      
      return res.status(409).json({
        success: false,
        message: 'Recurso já existe. Use o token/link existente.',
        token: existing.token,
        integrateLink,
        details: 'Email ou empresa já cadastrado'
      });
    }

    // Gerar token único
    const token = uuidv4();

    // Preparar payload para n8n
    const payload = {
      name,
      owner_name,
      owner_phone,
      owner_email,
      target_country,
      base_agent: agentIdMillis,
      street,
      timezone,
      area_code,
      slug,
      token,
      created_at: new Date().toISOString()
    };

    // 1. Enviar para webhook n8n
    try {
      const n8nUrl = process.env.N8N_WEBHOOK_URL!;
      await axios.post(n8nUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    } catch (n8nError) {
      console.error('Erro ao enviar para n8n:', n8nError);
      // Continua mesmo se n8n falhar (não crítico)
    }

    // 2. Gerar link de integração
    const baseUrl = getBaseUrl(req);
    const integrateLink = `${baseUrl}/connect?token=${token}`;

    // 3. Persistir no store
    store.set(token, {
      token,
      slug,
      payload,
      status: 'pending',
      createdAt: new Date()
    });

    // 4. Enviar WhatsApp via Twilio
    const message = `Olá ${owner_name}, acesse o link para autorizar a integração do WhatsApp e permitir configuração do número Twilio: ${integrateLink}`;
    
    try {
      await sendWhatsAppMessage(owner_phone, message);
    } catch (whatsappError) {
      console.error('Erro ao enviar WhatsApp, tentando SMS:', whatsappError);
      try {
        await sendSMSMessage(owner_phone, message);
      } catch (smsError) {
        console.error('Erro ao enviar SMS:', smsError);
        // Registra erro mas não falha a requisição
      }
    }

    // 5. Enviar Email
    try {
      await sendEmail({
        to: owner_email,
        subject: 'Global Call Partners - Link de Integração WhatsApp',
        html: `
          <h2>Olá ${owner_name},</h2>
          <p>Recebemos sua solicitação de integração do WhatsApp Business API.</p>
          <p>Para continuar, clique no link abaixo para autorizar a integração:</p>
          <p><a href="${integrateLink}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: white; text-decoration: none; border-radius: 6px;">Autorizar Integração</a></p>
          <p>Ou copie e cole este link no navegador:</p>
          <p>${integrateLink}</p>
          <br>
          <p>Atenciosamente,<br>Global Call Partners</p>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Registra erro mas não falha a requisição
    }

    // 6. Retornar sucesso
    res.json({
      success: true,
      message: 'Cadastro realizado com sucesso! Verifique seu WhatsApp e email.',
      token,
      integrateLink
    });

  } catch (error) {
    console.error('Erro em /api/submit:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /connect?token=... - Redirecionar para OAuth do Facebook
app.get('/connect', (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).send('Token inválido ou ausente');
    }

    // Verificar se token existe
    const data = store.get(token);
    if (!data) {
      return res.status(404).send('Token não encontrado ou expirado');
    }

    // Construir URL OAuth do Facebook
    const fbAppId = process.env.FACEBOOK_APP_ID!;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI!;
    
    // Scopes necessários para WABA
    const scopes = [
      'pages_show_list',
      'business_management',
      'whatsapp_business_management',
      'whatsapp_business_messaging'
    ].join(',');

    const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?` +
      `client_id=${fbAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${token}` +
      `&scope=${encodeURIComponent(scopes)}`;

    res.redirect(authUrl);

  } catch (error) {
    console.error('Erro em /connect:', error);
    res.status(500).send('Erro ao iniciar OAuth');
  }
});

// GET /auth/facebook/callback - Callback OAuth do Facebook
app.get('/auth/facebook/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.status(400).send('Callback inválido: código ou state ausentes');
    }

    const token = state;

    // Verificar token
    const data = store.get(token);
    if (!data) {
      return res.status(404).send('Token não encontrado');
    }

    // Trocar code por access_token
    const fbAppId = process.env.FACEBOOK_APP_ID!;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET!;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI!;

    const tokenUrl = `https://graph.facebook.com/v17.0/oauth/access_token?` +
      `client_id=${fbAppId}` +
      `&client_secret=${fbAppSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const tokenResponse = await axios.get(tokenUrl);
    const accessToken = tokenResponse.data.access_token;

    // Buscar dados básicos do usuário
    const userUrl = `https://graph.facebook.com/v17.0/me?` +
      `fields=id,name,email` +
      `&access_token=${accessToken}`;

    const userResponse = await axios.get(userUrl);
    const userData = userResponse.data;

    // Atualizar store com access_token e dados do Facebook
    store.update(token, {
      facebookAccessToken: accessToken,
      facebookUserData: userData,
      status: 'connected'
    });

    // Redirecionar para página de sucesso
    res.sendFile(path.join(__dirname, '../public/integrate_success.html'));

  } catch (error) {
    console.error('Erro em /auth/facebook/callback:', error);
    res.status(500).send('Erro ao processar callback do Facebook');
  }
});

// GET /debug/token/:token - Debug (desenvolvimento)
app.get('/debug/token/:token', (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const data = store.get(token);

    if (!data) {
      return res.status(404).json({ error: 'Token não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro em /debug/token:', error);
    res.status(500).json({ error: 'Erro ao buscar token' });
  }
});

// GET /api/status - Healthcheck
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DELETE /debug/clear - Limpar store (DEV ONLY)
app.delete('/debug/clear', (req: Request, res: Response) => {
  try {
    const allData = store.getAll();
    const count = allData.length;
    
    // Limpar todos os tokens
    allData.forEach(data => {
      store.delete(data.token);
    });

    res.json({ 
      success: true, 
      message: `${count} registros removidos do store`,
      cleared: count 
    });
  } catch (error) {
    console.error('Erro em /debug/clear:', error);
    res.status(500).json({ error: 'Erro ao limpar store' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro global:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Servidor rodando na porta ${PORT}`);
  console.log(`✓ URL: http://localhost:${PORT}`);
  console.log(`✓ Healthcheck: http://localhost:${PORT}/api/status`);
});
