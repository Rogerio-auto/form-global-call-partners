import { useState, FormEvent, useEffect } from 'react'
import './OnboardingForm.css'

interface Agent {
  id: string
  name: string
  description: string
  id_millis: string
}

interface FormData {
  name: string
  owner_name: string
  owner_phone: string
  owner_email: string
  target_country: string
  base_agent: string
  street: string
  timezone: string
  area_code: string
  opt_in_consent: boolean
  business_niche: string
  service_area: string
  business_hours: string
  services_offered: string
  services_not_offered: string
}

interface SubmitResponse {
  success: boolean
  message: string
  token?: string
  integrateLink?: string
  details?: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

function OnboardingForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    target_country: '',
    base_agent: '',
    street: '',
    timezone: '',
    area_code: '',
    opt_in_consent: false,
    business_niche: '',
    service_area: '',
    business_hours: '',
    services_offered: '',
    services_not_offered: ''
  })

  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [response, setResponse] = useState<SubmitResponse | null>(null)

  // Buscar agentes ao montar o componente
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        if (data.success && data.agents) {
          setAgents(data.agents)
        }
      } catch (error) {
        console.error('Erro ao carregar agentes:', error)
      } finally {
        setLoadingAgents(false)
      }
    }

    fetchAgents()
  }, [])

  const validateE164 = (phone: string): boolean => {
    // Formato E.164: + seguido de 1-15 dígitos
    const e164Regex = /^\+[1-9]\d{1,14}$/
    return e164Regex.test(phone)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!validateE164(formData.owner_phone)) {
      setStatus('error')
      setResponse({
        success: false,
        message: 'Telefone deve estar no formato E.164 (ex: +5511999999999)',
        details: 'Formato inválido'
      })
      return
    }

    if (!formData.opt_in_consent) {
      setStatus('error')
      setResponse({
        success: false,
        message: 'É necessário aceitar receber mensagens para continuar',
        details: 'Consentimento obrigatório'
      })
      return
    }

    setStatus('submitting')
    setResponse(null)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data: SubmitResponse = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        setResponse(data)
      } else {
        setStatus('error')
        setResponse(data)
      }
    } catch (error) {
      setStatus('error')
      setResponse({
        success: false,
        message: 'Erro ao conectar com o servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  const resetForm = () => {
    setStatus('idle')
    setResponse(null)
    setFormData({
      name: '',
      owner_name: '',
      owner_phone: '',
      owner_email: '',
      target_country: '',
      business_niche: '',
      service_area: '',
      business_hours: '',
      services_offered: '',
      services_not_offered: '',
      base_agent: '',
      street: '',
      timezone: '',
      area_code: '',
      opt_in_consent: false
    })
  }

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>Cadastro de Integração</h2>
        <p className="form-description">
          Preencha os dados abaixo para iniciar a integração WhatsApp Business API
        </p>

        {status === 'success' && response && (
          <div className="alert alert-success">
            <h3>✓ Cadastro realizado com sucesso!</h3>
            <p>{response.message}</p>
            {response.integrateLink && (
              <div className="integration-info">
                <p><strong>Token:</strong> <code>{response.token}</code></p>
                <p><strong>Link de integração:</strong></p>
                <a href={response.integrateLink} target="_blank" rel="noopener noreferrer" className="integrate-link">
                  {response.integrateLink}
                </a>
                <p className="info-text">
                  ℹ️ Um link foi enviado para o WhatsApp e email informados. Clique para autorizar a integração.
                </p>
              </div>
            )}
            <button onClick={resetForm} className="btn btn-secondary">
              Novo Cadastro
            </button>
          </div>
        )}

        {status === 'error' && response && (
          <div className="alert alert-error">
            <h3>✗ Erro no cadastro</h3>
            <p>{response.message}</p>
            {response.details && (
              <p className="error-details">{response.details}</p>
            )}
            <button onClick={() => setStatus('idle')} className="btn btn-secondary">
              Tentar Novamente
            </button>
          </div>
        )}

        {(status === 'idle' || status === 'submitting') && (
          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-group">
              <label htmlFor="name">Nome da Empresa *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                placeholder="Empresa XYZ Ltda"
              />
            </div>

            <div className="form-group">
              <label htmlFor="owner_name">Nome do Proprietário *</label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                placeholder="João Silva"
              />
            </div>

            <div className="form-group">
              <label htmlFor="owner_phone">Telefone (E.164) *</label>
              <input
                type="tel"
                id="owner_phone"
                name="owner_phone"
                value={formData.owner_phone}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                placeholder="+5511999999999"
                pattern="^\+[1-9]\d{1,14}$"
                title="Formato E.164: +5511999999999"
              />
              <small>Formato: +[código país][DDD][número]</small>
            </div>

            <div className="form-group">
              <label htmlFor="owner_email">Email *</label>
              <input
                type="email"
                id="owner_email"
                name="owner_email"
                value={formData.owner_email}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
                placeholder="joao@empresa.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="target_country">País Alvo *</label>
                <input
                  type="text"
                  id="target_country"
                  name="target_country"
                  value={formData.target_country}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Brasil"
                />
              </div>

              <div className="form-group">
                <label htmlFor="area_code">Código de Área</label>
                <input
                  type="text"
                  id="area_code"
                  name="area_code"
                  value={formData.area_code}
                  onChange={handleChange}
                  disabled={status === 'submitting'}
                  placeholder="11"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="base_agent">Agente Base *</label>
              <select
                id="base_agent"
                name="base_agent"
                value={formData.base_agent}
                onChange={handleChange}
                required
                disabled={status === 'submitting' || loadingAgents}
              >
                <option value="">
                  {loadingAgents ? 'Carregando agentes...' : 'Selecione um agente'}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              {formData.base_agent && (
                <small className="agent-description">
                  {agents.find(a => a.id === formData.base_agent)?.description}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="street">Endereço</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                disabled={status === 'submitting'}
                placeholder="Rua Exemplo, 123"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone *</label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                required
                disabled={status === 'submitting'}
              >
                <option value="">Selecione...</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            {/* Segunda Seção - Informações do Negócio */}
            <div className="form-section">
              <div className="section-header">
                <h3>📊 Informações do Negócio</h3>
                <p>Conte-nos mais sobre sua empresa e serviços</p>
              </div>

              <div className="form-group">
                <label htmlFor="business_niche">Qual o nicho da sua empresa? *</label>
                <input
                  type="text"
                  id="business_niche"
                  name="business_niche"
                  value={formData.business_niche}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Ex: Saúde e Bem-estar, Tecnologia, E-commerce, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="service_area">Qual a área que você atende? *</label>
                <input
                  type="text"
                  id="service_area"
                  name="service_area"
                  value={formData.service_area}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Ex: São Paulo - SP, Todo Brasil, América Latina, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="business_hours">Qual horário de funcionamento? *</label>
                <input
                  type="text"
                  id="business_hours"
                  name="business_hours"
                  value={formData.business_hours}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Ex: Seg-Sex 9h-18h, 24/7, Horário comercial, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="services_offered">Que tipo de serviço você faz? *</label>
                <textarea
                  id="services_offered"
                  name="services_offered"
                  value={formData.services_offered}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Descreva os principais serviços ou produtos que você oferece..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="services_not_offered">Que tipo de serviço você NÃO faz? *</label>
                <textarea
                  id="services_not_offered"
                  name="services_not_offered"
                  value={formData.services_not_offered}
                  onChange={handleChange}
                  required
                  disabled={status === 'submitting'}
                  placeholder="Descreva o que você não oferece para evitar expectativas incorretas..."
                  rows={4}
                />
              </div>
            </div>

            <div className="opt-in-container">
              <div className="opt-in-header">
                <span className="opt-in-icon">📱</span>
                <h3>Consentimento de Comunicação</h3>
              </div>
              <div className="opt-in-content">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="opt_in_consent"
                    checked={formData.opt_in_consent}
                    onChange={handleChange}
                    required
                    disabled={status === 'submitting'}
                  />
                  <span className="checkbox-text">
                    <strong className="opt-in-main-text">
                      ✓ Sim, autorizo o recebimento de mensagens SMS
                    </strong>
                    <span className="opt-in-description">
                      Você receberá mensagens de texto da <strong>MB CREATIVE LLC</strong> e <strong>Global Call Partners</strong> no número fornecido, incluindo:
                    </span>
                    <ul className="opt-in-list">
                      <li>Notificações importantes do sistema</li>
                      <li>Atualizações sobre sua conta</li>
                      <li>Alertas de segurança e confirmações</li>
                      <li>Comunicações de marketing (ocasionalmente)</li>
                    </ul>
                    <span className="terms-text">
                      📋 <strong>Informações importantes:</strong><br/>
                      • Taxas de mensagens e dados podem ser aplicadas conforme seu plano<br/>
                      • Responda <strong>STOP</strong> a qualquer momento para cancelar<br/>
                      • Responda <strong>HELP</strong> para obter suporte<br/>
                      • Frequência das mensagens: varia conforme a atividade
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default OnboardingForm
