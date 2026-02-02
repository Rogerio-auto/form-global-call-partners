import dotenv from "dotenv";

// Carregar variáveis de ambiente ANTES de importar outros módulos
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios from "axios";
import { getAgents, getAgentById } from "./lib/supabase";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validação de telefone E.164
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// GET /api/agents - Buscar agentes do Supabase
app.get("/api/agents", async (_req: Request, res: Response) => {
  try {
    const agents = await getAgents();
    res.json({ success: true, agents });
  } catch (error) {
    console.error("Erro ao buscar agentes:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar agentes",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// POST /api/submit - Submeter formulário de onboarding
app.post("/api/submit", async (req: Request, res: Response): Promise<any> => {
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
        message: "Campos obrigatórios faltando",
        details: "name, owner_name, owner_phone, owner_email, target_country, base_agent e timezone são obrigatórios"
      });
    }

    if (!isValidE164(owner_phone)) {
      return res.status(400).json({
        success: false,
        message: "Telefone inválido",
        details: "O telefone deve estar no formato E.164 (ex: +5511999999999)"
      });
    }

    // Buscar dados do agente (id_millis e nome)
    let agentIdMillis = base_agent;
    let agentName = "";
    try {
      const agent = await getAgentById(base_agent);
      if (agent) {
        agentIdMillis = agent.id_millis;
        agentName = agent.name;
      }
    } catch (error) {
      console.warn("Erro ao buscar agente, usando ID fornecido:", error);
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
      console.error("N8N_WEBHOOK_URL não configurada");
      return res.status(500).json({
        success: false,
        message: "Webhook não configurado",
        details: "N8N_WEBHOOK_URL não foi definida nas variáveis de ambiente"
      });
    }

    try {
      await axios.post(n8nUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      console.log(" Dados enviados para webhook n8n com sucesso");

      return res.json({
        success: true,
        message: "Cadastro realizado com sucesso! Seus dados foram enviados para processamento.",
        data: {
          name,
          owner_name,
          owner_email,
          agent: agentName || agentIdMillis
        }
      });

    } catch (webhookError: any) {
      console.error("Erro ao enviar para webhook n8n:", webhookError.message);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar dados para processamento",
        details: webhookError instanceof Error ? webhookError.message : "Erro ao conectar com webhook"
      });
    }

  } catch (error) {
    console.error("Erro em /api/submit:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// GET /api/status - Healthcheck
app.get("/api/status", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    webhook_configured: !!process.env.N8N_WEBHOOK_URL
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erro global:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

// Start server
app.listen(PORT, () => {
  console.log("========================================");
  console.log("  Global Call Partners - Backend API");
  console.log("========================================");
  console.log(` Servidor rodando na porta ${PORT}`);
  console.log(` Healthcheck: http://localhost:${PORT}/api/status`);
  console.log(` Webhook n8n: ${process.env.N8N_WEBHOOK_URL ? "Configurado" : "  NÃO CONFIGURADO"} `);
  console.log("========================================");
});
