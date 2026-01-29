# Global Call Partners - Onboarding Integration

Monorepo TypeScript com frontend React + Vite e backend Express para fluxo de onboarding com integração Facebook OAuth, WhatsApp (Twilio) e webhook n8n.

## Estrutura do Projeto

```
/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript
└── README.md
```

## Pré-requisitos

- Node.js 18+ e npm
- Conta Twilio (para WhatsApp/SMS)
- Facebook App configurado (para OAuth)
- Servidor SMTP (para emails)

## Setup Inicial

### 1. Configurar Facebook App

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app ou use existente
3. Em "Facebook Login" > "Settings", adicione a Redirect URI:
   - Desenvolvimento: `http://localhost:3001/auth/facebook/callback`
   - Produção: `https://seu-dominio.com/auth/facebook/callback`
4. Anote o **App ID** e **App Secret**
5. Adicione permissões necessárias: `pages_show_list`, `business_management`, `whatsapp_business_management`

### 2. Configurar Twilio

1. Acesse [Twilio Console](https://www.twilio.com/console)
2. Anote **Account SID** e **Auth Token**
3. Para WhatsApp:
   - Use Twilio Sandbox: `whatsapp:+14155238886` (dev)
   - Ou configure número próprio (produção)
4. Para SMS fallback, configure um número Twilio

### 3. Configurar Variáveis de Ambiente

Copie o `.env.example` para `.env` no backend:

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env` com suas credenciais reais:

```env
# Server
PORT=3001
BASE_URL=http://localhost:3001

# Facebook OAuth
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui
FACEBOOK_REDIRECT_URI=http://localhost:3001/auth/facebook/callback

# Twilio
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_SENDER=whatsapp:+14155238886
TWILIO_SMS_SENDER=+1234567890

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_ou_app_password

# n8n Webhook
N8N_WEBHOOK_URL=https://autowebhook.globalcallpartnes.cloud/webhook/onboarding

# App Secret (para tokens)
APP_SECRET=seu_secret_aleatório_aqui

# Supabase (para agentes)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 4. Configurar Supabase (Agentes)

Siga as instruções detalhadas em [`backend/SUPABASE_SETUP.md`](backend/SUPABASE_SETUP.md) para:
1. Criar projeto no Supabase
2. Criar tabela de agentes
3. Inserir agentes de exemplo
4. Obter credenciais (URL e anon key)

### 5. Instalar Dependências

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
   - País alvo, agente base, etc.
3. Clique em "Enviar"

### 2. Verificar Envios

- **WhatsApp**: Verifique o número informado (se usar Twilio Sandbox, precisa estar inscrito)
- **Email**: Verifique a caixa de entrada do email informado
- **Webhook n8n**: Payload será enviado para o webhook configurado

### 3. Clicar no Link de Integração

O link recebido será algo como:
```
http://localhost:3001/connect?token=uuid-gerado
```

Isso iniciará o fluxo OAuth do Facebook.

### 4. Autorizar no Facebook

1. Faça login na conta Meta Business
2. Conceda as permissões solicitadas
3. Será redirecionado para página de sucesso

### 5. Debug (Desenvolvimento)

Verificar dados armazenados:
```
GET http://localhost:3001/debug/token/seu-token-uuid
```

Healthcheck:
```
GET http://localhost:3001/api/status
```

## Testes com Ngrok (OAuth Callback)

Para testar OAuth em ambiente local:

1. Instale [ngrok](https://ngrok.com/)
2. Execute:
   ```bash
   ngrok http 3001
   ```
3. Anote a URL (ex: `https://abc123.ngrok.io`)
4. Atualize no `.env`:
   ```
   BASE_URL=https://abc123.ngrok.io
   FACEBOOK_REDIRECT_URI=https://abc123.ngrok.io/auth/facebook/callback
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

## Persistência com Supabase (Migração Futura)

O código atual usa armazenamento em memória (`Map`). Para produção, migre para Supabase:

### Exemplo de Schema SQL

```sql
CREATE TABLE onboarding_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token UUID UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  facebook_access_token TEXT,
  facebook_user_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Substituir no Código

Veja comentários no arquivo `backend/src/store.ts` com exemplos de chamadas REST para Supabase.

## Observações de Segurança

- **Nunca commite** o arquivo `.env` com credenciais reais
- Use `.env.example` como template
- Em produção, use variáveis de ambiente do host (Vercel, Railway, etc.)
- Valide e sanitize todos os inputs do usuário
- Use HTTPS em produção

## WABA (WhatsApp Business API) - Passos Manuais

Após o OAuth, passos adicionais podem ser necessários:

1. **Business Verification**: Verificar empresa no Meta Business Manager
2. **Phone Number**: Adicionar e verificar número de telefone no WABA
3. **Template Approval**: Criar e aprovar templates de mensagem
4. **Webhook Configuration**: Configurar webhook para receber mensagens

O OAuth apenas coleta permissões e access token. A configuração completa do WABA requer passos no Meta Business Manager.

## Estrutura de APIs

### Backend Endpoints

- `POST /api/submit` - Submeter formulário de onboarding
- `GET /connect?token=<uuid>` - Iniciar OAuth do Facebook
- `GET /auth/facebook/callback` - Callback do OAuth
- `GET /debug/token/:token` - Debug (dev only)
- `GET /api/status` - Healthcheck

### Fluxo de Dados

```
[Formulário] 
    ↓ POST /api/submit
[Backend]
    ↓ Envia para n8n webhook
    ↓ Gera token + link
    ↓ Envia WhatsApp (Twilio)
    ↓ Envia Email (SMTP)
[Usuário recebe link]
    ↓ Clica em link
[OAuth Facebook]
    ↓ Autoriza
[Callback salva access_token]
    ↓ Página de sucesso
```

## Troubleshooting

### Erro: "Cannot send WhatsApp message"

- Verifique credenciais Twilio no `.env`
- Se usar Sandbox, certifique-se que o número está inscrito (envie "join <código>" para o sandbox)
- Valide formato E.164 do telefone

### Erro: "OAuth redirect mismatch"

- Verifique se `FACEBOOK_REDIRECT_URI` no `.env` corresponde exatamente ao configurado no Facebook App
- Use ngrok para testes locais

### Erro: "Email not sent"

- Verifique credenciais SMTP no `.env`
- Para Gmail, use "App Password" ao invés da senha normal
- Verifique firewall/portas

### Erro 409: "Resource already exists"

- O sistema detectou email ou slug duplicado
- Use o token/link existente retornado na resposta

## Suporte

Para dúvidas ou problemas, consulte:

- [Twilio Docs](https://www.twilio.com/docs)
- [Facebook OAuth](https://developers.facebook.com/docs/facebook-login)
- [Meta Business API](https://developers.facebook.com/docs/whatsapp)

---

**Desenvolvido com TypeScript + React + Express**
