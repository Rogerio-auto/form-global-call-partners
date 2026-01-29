import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Credenciais Supabase não configuradas.');
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  id_millis: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Buscar todos os agentes do Supabase
 */
export async function getAgents(): Promise<Agent[]> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase não configurado');
  }

  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/ai_agents`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,name,description,id_millis,created_at'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agentes do Supabase:', error);
    throw error;
  }
}

/**
 * Buscar um agente específico por ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase não configurado');
  }

  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/ai_agents`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        id: `eq.${id}`,
        select: 'id,name,description,id_millis'
      }
    });

    return response.data[0] || null;
  } catch (error) {
    console.error('Erro ao buscar agente do Supabase:', error);
    throw error;
  }
}
