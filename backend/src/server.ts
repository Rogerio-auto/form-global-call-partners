import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de importar outros módulos
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import { getAgents, getAgentById } from './lib/supabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper para gerar slug
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// GET /api/agents - Buscar agentes do Supabase
app.get('/api/agents', async (_req: Request, res: Response) => {
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
app.post('/api/submit', async (req: Request, res: Response): Promise<any> => {
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
      area_code,
      business_niche,
      service_area,
      business_hours,
      services_offered,
      services_not_offered
    } = req.body;

    // Validações básicas
    if (!name || !owner_name || !owner_phone || !owner_email || !target_country || !base_agent || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
        details: 'name, owner_name, owner_phone, owner_email, target_country, base_agent e timezone são obrigatórios'
      });
    }

    // Validações dos novos campos
    if (!business_niche || !service_area || !business_hours || !services_offered || !services_not_offered) {
      return res.status(400).json({
        success: false,
        message: 'Campos de informações do negócio faltando',
        details: 'business_niche, service_area, business_hours, services_offered e services_not_offered são obrigatórios'
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
    let agentName = '';
    try {
      const agent = await getAgentById(base_agent);
      if (agent) {
        agentIdMillis = agent.id_millis;
        agentName = agent.name;
      }
    } catch (error) {
      console.warn('Erro ao buscar agente, usando ID fornecido:', error);
    }

    // Preparar payload para n8n
    const payload = {
      name,
      owner_name,
      owner_phone,
      owner_email,
      target_country,
      base_agent: agentIdMillis,
      base_agent_name: agentName,
      street,
      timezone,
      area_code,
      business_niche,
      service_area,
      business_hours,
      services_offered,
      services_not_offered,
      created_at: new Date().toISOString()
    };

    // Enviar para webhook n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nUrl) {
      console.error('N8N_WEBHOOK_URL não configurada');
      return res.status(500).json({
        success: false,
        message: 'Webhook não configurado',
        details: 'N8N_WEBHOOK_URL não foi definida nas variáveis de ambiente'
      });
    }

    try {
      await axios.post(n8nUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✓ Dados enviados para webhook n8n com sucesso');

      // Retornar sucesso
      res.json({
        success: true,
        message: 'Cadastro realizado com sucesso! Seus dados foram enviados para processamento.',
        data: {
          name,
          owner_name,
          owner_email,
          agent: agentName || agentIdMillis
        }
      });

    } catch (webhookError) {
      console.error('Erro ao enviar para webhook n8n:', webhookError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar dados para processamento',
        details: webhookError instanceof Error ? webhookError.message : 'Erro ao conectar com webhook'
      });
    }(!token || typeof token !== 'string') {
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
app.get('/auth/facebook/callback', async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, state } = req.query;

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.status(400).send('Callback inválido: código ou state ausentes');
    }api/status - Healthcheck
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    webhook_configured: !!process.env.N8N_WEBHOOK_URL
  });'========================================');
  console.log('  Global Call Partners - Backend API');
  console.log('========================================');
  console.log(`✓ Servidor rodando na porta ${PORT}`);
  console.log(`✓ URL: http://localhost:${PORT}`);
  console.log(`✓ Healthcheck: http://localhost:${PORT}/api/status`);
  console.log(`✓ Webhook n8n: ${process.env.N8N_WEBHOOK_URL ? 'Configurado' : '⚠️  NÃO CONFIGURADO'}`);
  console.log('========================================'