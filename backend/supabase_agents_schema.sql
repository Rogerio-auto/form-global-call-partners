-- Criar tabela de agentes IA no Supabase
-- Execute este SQL no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  id_millis TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca por id_millis
CREATE INDEX IF NOT EXISTS idx_ai_agents_id_millis ON ai_agents(id_millis);

-- Habilitar Row Level Security (RLS)
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (necessário para a API)
CREATE POLICY "Allow public read access" ON ai_agents
  FOR SELECT
  USING (true);

-- Política para permitir inserção apenas por usuários autenticados (opcional)
CREATE POLICY "Allow authenticated insert" ON ai_agents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Inserir agentes de exemplo
INSERT INTO ai_agents (name, description, id_millis) VALUES
  ('Agente de Coleta de Dados', 'Especializado em coletar informações de clientes e leads', 'agent-001'),
  ('Agente de Marcação de Reuniões', 'Agenda e confirma reuniões automaticamente', 'agent-002'),
  ('Agente de Suporte Técnico', 'Responde dúvidas técnicas e resolve problemas', 'agent-003'),
  ('Agente de Vendas', 'Qualifica leads e fecha vendas', 'agent-004'),
  ('Agente de Follow-up', 'Realiza acompanhamento de clientes e oportunidades', 'agent-005'),
  ('Agente de Pesquisa de Satisfação', 'Coleta feedback e avaliações de clientes', 'agent-006')
ON CONFLICT (id_millis) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
