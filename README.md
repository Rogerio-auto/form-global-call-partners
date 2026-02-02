# Global Call Partners - Formulário de Onboarding

Sistema de captura de informações via formulário web com envio automático para webhook n8n.

## Estrutura do Projeto

```
/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript
└── README.md
```

## Pré-requisitos

- Node.js 18+ e npm
- Webhook n8n configurado

## Setup Inicial

### 1. Configurar Variáveis de Ambiente

Crie o arquivo `backend/.env`:

```env
# Server
PORT=3001

# n8n Webhook (OBRIGATÓRIO)
N8N_WEBHOOK_URL=https://autowebhook.globalcallpartnes.cloud/webhook/onboarding

# Supabase (para lista de agentes)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 2. Configurar Supabase (Agentes IA)

Siga as instruções detalhadas em [`backend/SUPABASE_SETUP.md`](backend/SUPABASE_SETUP.md) para:
1. Criar projeto no Supabase
2. Criar tabela de agentes
3. Inserir agentes de exemplo
4. Obter credenciais (URL e anon key)

### 3. Instalar Dependências

Na raiz do projeto:

```bash
# Instalar todas as dependências
npm run install:all
```

Ou individualmente:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

## Executar em Desenvolvimento

### Opção 1: Rodar ambos simultaneamente (da raiz)

```bash
npm run dev
```

### Opção 2: Rodar separadamente

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Testar o Fluxo

### 1. Preencher Formulário

1. Acesse http://localhost:5173
2. Preencha o formulário com:
   - Nome da empresa
   - Nome do proprietário
   - Telefone (formato E.164: +5511999999999)
   - Email
   - País alvo
   - Selecione um agente IA
   - Timezone
   - Aceite o consentimento de SMS (obrigatório)
3. Clique em "Enviar"

### 2. Verificar Webhook

Os dados serão enviados automaticamente para o webhook n8n configurado em `N8N_WEBHOOK_URL`.

**Payload enviado:**
```json
{
  "name": "Empresa XYZ",
  "owner_name": "João Silva",
  "owner_phone": "+5511999999999",
  "owner_email": "joao@empresa.com",
  "target_country": "Brasil",
  "base_agent": "agent-001",
  "base_agent_name": "Agente de Coleta de Dados",
  "street": "Rua Exemplo, 123",
  "timezone": "America/Sao_Paulo",
  "area_code": "11",
  "created_at": "2026-02-02T10:30:00.000Z"
}
```
Healthcheck:
```
GET http://localhost:3001/api/status
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "webhook_configured": true
}
```

## Estrutura de Dados

### Campos do Formulário

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome da empresa |
| `owner_name` | string | Sim | Nome do proprietário |
| `owner_phone` | string | Sim | Telefone no formato E.164 |
| `owner_email` | string | Sim | Email do proprietário |
| `target_country` | string | Sim | País de operação |
| `base_agent` | string | Sim | ID do agente IA (Supabase) |
| `timezone` | string | Sim | Timezone (IANA) |
| `street` | string | Não | Endereço completo |
| `area_code` | string | Não | Código de área/DDD |

### Opt-in Consent

O formulário inclui um opt-in obrigatório para recebimento de mensagens SMS da **MB CREATIVE LLC** e **Global Call Partners**, conforme requisitos do Twilio:

- ✅ Consentimento explícito do usuário
- 📋 Informações sobre tipos de mensagens
- 🛑 Instruções de cancelamento (STOP)
- ℹ️ Instruções de ajuda (HELP)
- 💰 Avisos sobre taxas de mensagens

## Fluxo de Dados

```
[Usuário] → [Formulário React]
               ↓ POST /api/submit
           [Backend Express]
               ↓ Valida dados
               ↓ Busca info do agente (Supabase)
               ↓ POST webhook
           [n8n Webhook]
               ↓ Processa automação
           [Sucesso] → Retorna confirmação
```URI=https://abc123.ngrok.io/auth/facebook/callback
   ```
5. Atualize a Redirect URI no Facebook App Dashboard
6. Reinicie o backend

## Build para Produção

### Frontend

```bash
cd frontend
npm run build
```

Arquivos gerados em `frontend/dist/`

### Backend

```bash
cd backend
npm run build
```

Arquivos gerados em `backend/dist/`

Para executar produção:
```bash
cd backend
npm start
```

## Endpoints Disponíveis

### `GET /api/agents`
Lista todos os agentes IA disponíveis do Supabase.

**Resposta:**
```json
{
  "success": true,
  "agents": [
    {
      "id": "uuid",
      "name": "Agente de Coleta de Dados",
      "description": "Especializado em coletar informações...",
      "id_millis": "agent-001"
    }
  ]
}
```

### `POST /api/submit`
Submete os dados do formulário e envia para o webhook n8n.

**Body:**
```json
{
  "name": "Empresa XYZ",
  "owner_name": "João Silva",
  "owner_phone": "+5511999999999",
  "owner_email": "joao@empresa.com",
  "target_country": "Brasil",
  "base_agent": "uuid-do-agente",
  "timezone": "America/Sao_Paulo",
  "street": "Rua Exemplo, 123",
  "area_code": "11"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Cadastro realizado com sucesso!",
  "data": {
    "name": "Empresa XYZ",
    "owner_name": "João Silva",
    "owner_email": "joao@empresa.com",
    "agent": "Agente de Coleta de Dados"
  }
}
```

### `GET /api/status`
Healthcheck do servidor.

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "webhook_configured": true
}
```

## Observações de Segurança

- **Nunca commite** o arquivo `.env` com credenciais reais
- Use variáveis de ambiente do host em produção (Vercel, Railway, etc.)
- Valide e sanitize todos os inputs do usuário
- Use HTTPS em produção
- Configure CORS adequadamente para produção

## Webhook n8n - Exemplo de Configuração

1. No n8n, crie um workflow com trigger "Webhook"
2. Configure o método como `POST`
3. Copie a URL gerada
4. Adicione no arquivo `.env` como `N8N_WEBHOOK_URL`
5. O payload recebido terá todos os campos do formulário

## Troubleshooting

### Erro: "Webhook não configurado"
- Verifique se `N8N_WEBHOOK_URL` está definida no arquivo `.env`
- Reinicie o servidor backend após alterar o `.env`

### Erro: "Erro ao buscar agentes"
- Verifique as credenciais do Supabase (`SUPABASE_URL` e `SUPABASE_ANON_KEY`)
- Certifique-se que a tabela `ai_agents` foi criada corretamente
- Verifique as políticas RLS no Supabase

### Erro: "Telefone inválido"
- O telefone deve estar no formato E.164: `+[código país][DDD][número]`
- Exemplo Brasil: `+5511999999999`
- Exemplo EUA: `+14155551234`

## Próximos Passos (Opcional)

Se desejar adicionar persistência dos dados enviados:
1. Crie uma nova tabela no Supabase para armazenar os submissions
2. Após enviar para o webhook, salve também no Supabase
3. Implemente dashboard de visualização dos dados

---

**Stack:** TypeScript + React + Express + Supabase + n8n
