# Configuração do Supabase

## 1. Criar Projeto no Supabase

1. Acesse [Supabase](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: Global Call Partners
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima
5. Aguarde a criação do projeto (1-2 minutos)

## 2. Obter Credenciais

1. No dashboard do projeto, vá em **Settings** > **API**
2. Copie os valores:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **anon public key**: `eyJhb...` (chave longa)

3. Adicione ao arquivo `backend/.env`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## 3. Criar Tabela de Agentes

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `supabase_agents_schema.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a confirmação "Success. No rows returned"

## 4. Verificar Dados

1. Vá em **Table Editor**
2. Selecione a tabela **ai_agents**
3. Você deve ver 6 agentes cadastrados:
   - Agente de Coleta de Dados
   - Agente de Marcação de Reuniões
   - Agente de Suporte Técnico
   - Agente de Vendas
   - Agente de Follow-up
   - Agente de Pesquisa de Satisfação

## 5. Testar API

Execute no terminal (com o backend rodando):

```bash
curl http://localhost:3001/api/agents
```

Resposta esperada:
```json
{
  "success": true,
  "agents": [
    {
      "id": "uuid-aqui",
      "name": "Agente de Coleta de Dados",
      "description": "Especializado em coletar informações...",
      "id_millis": "agent-001"
    },
    ...
  ]
}
```

## 6. Adicionar Novos Agentes (Opcional)

Vá em **Table Editor** > **ai_agents** > **Insert row** e preencha:

- **name**: Nome do agente (ex: "Agente de Marketing")
- **description**: Descrição detalhada
- **id_millis**: ID único (ex: "agent-007")

O campo **id** será gerado automaticamente.

## Estrutura da Tabela

```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,              -- Gerado automaticamente
  name TEXT NOT NULL,               -- Nome do agente
  description TEXT,                 -- Descrição
  id_millis TEXT NOT NULL UNIQUE,   -- ID customizado
  created_at TIMESTAMPTZ,           -- Data de criação
  updated_at TIMESTAMPTZ            -- Data de atualização
);
```

## Row Level Security (RLS)

A tabela está configurada com RLS permitindo:
- ✅ **Leitura pública**: Qualquer um pode consultar
- ❌ **Escrita**: Apenas usuários autenticados

Se precisar desabilitar temporariamente:
```sql
ALTER TABLE ai_agents DISABLE ROW LEVEL SECURITY;
```

## Troubleshooting

### Erro: "relation 'ai_agents' does not exist"
- Execute o SQL de criação da tabela novamente

### Erro: "Invalid API key"
- Verifique se copiou a chave **anon public** corretamente
- Certifique-se de que não há espaços extras no `.env`

### Dropdown não carrega agentes
1. Verifique se o backend está rodando
2. Abra o console do navegador (F12) e verifique erros
3. Teste a rota: `http://localhost:3001/api/agents`
4. Verifique se as credenciais do Supabase estão corretas no `.env`

### Erro 401/403 ao consultar
- Verifique as políticas RLS da tabela
- Execute: `ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;`
- Recrie a política de leitura pública
