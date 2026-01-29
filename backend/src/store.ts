/**
 * In-memory store para dados de onboarding
 * 
 * Para produção, substituir por Supabase ou outro banco de dados
 */

export interface OnboardingData {
  token: string;
  slug: string;
  payload: Record<string, any>;
  facebookAccessToken?: string;
  facebookUserData?: Record<string, any>;
  status: 'pending' | 'connected' | 'completed';
  createdAt: Date;
  updatedAt?: Date;
}

class OnboardingStore {
  private data: Map<string, OnboardingData>;
  private emailIndex: Map<string, string>; // email -> token
  private slugIndex: Map<string, string>;  // slug -> token

  constructor() {
    this.data = new Map();
    this.emailIndex = new Map();
    this.slugIndex = new Map();
  }

  set(token: string, data: OnboardingData): void {
    this.data.set(token, data);
    this.emailIndex.set(data.payload.owner_email, token);
    this.slugIndex.set(data.slug, token);

    // EXEMPLO para Supabase (REST API):
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    await fetch(`${supabaseUrl}/rest/v1/onboarding_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        token: data.token,
        slug: data.slug,
        owner_email: data.payload.owner_email,
        payload: data.payload,
        status: data.status,
        created_at: data.createdAt.toISOString()
      })
    });
    */
  }

  get(token: string): OnboardingData | undefined {
    return this.data.get(token);

    // EXEMPLO para Supabase (REST API):
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/onboarding_tokens?token=eq.${token}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    const records = await response.json();
    return records[0] || undefined;
    */
  }

  update(token: string, updates: Partial<OnboardingData>): void {
    const existing = this.data.get(token);
    if (!existing) return;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.data.set(token, updated);

    // EXEMPLO para Supabase (REST API):
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    await fetch(`${supabaseUrl}/rest/v1/onboarding_tokens?token=eq.${token}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        facebook_access_token: updates.facebookAccessToken,
        facebook_user_data: updates.facebookUserData,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
    });
    */
  }

  findByEmailOrSlug(email: string, slug: string): OnboardingData | undefined {
    const tokenByEmail = this.emailIndex.get(email);
    const tokenBySlug = this.slugIndex.get(slug);

    if (tokenByEmail) {
      return this.data.get(tokenByEmail);
    }

    if (tokenBySlug) {
      return this.data.get(tokenBySlug);
    }

    return undefined;

    // EXEMPLO para Supabase (REST API):
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/onboarding_tokens?or=(owner_email.eq.${email},slug.eq.${slug})`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    const records = await response.json();
    return records[0] || undefined;
    */
  }

  delete(token: string): void {
    const data = this.data.get(token);
    if (!data) return;

    this.data.delete(token);
    this.emailIndex.delete(data.payload.owner_email);
    this.slugIndex.delete(data.slug);

    // EXEMPLO para Supabase (REST API):
    /*
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    await fetch(`${supabaseUrl}/rest/v1/onboarding_tokens?token=eq.${token}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    */
  }

  getAll(): OnboardingData[] {
    return Array.from(this.data.values());
  }
}

export const store = new OnboardingStore();
