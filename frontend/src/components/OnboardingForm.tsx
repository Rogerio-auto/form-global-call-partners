import { useState, FormEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Clock, 
  Tag, 
  Briefcase, 
  XSquare, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react'
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
  const [currentStep, setCurrentStep] = useState(1)

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

  const nextStep = () => {
    // Validar campos do primeiro passo antes de avançar
    if (currentStep === 1) {
      if (!formData.name || !formData.owner_name || !formData.owner_phone || !formData.owner_email || !formData.base_agent || !formData.timezone) {
        setStatus('error')
        setResponse({
          success: false,
          message: 'Por favor, preencha todos os campos obrigatórios (*) do Passo 1',
          details: 'Campos pendentes'
        })
        return
      }
      
      if (!validateE164(formData.owner_phone)) {
        setStatus('error')
        setResponse({
          success: false,
          message: 'Telefone do proprietário deve estar no formato E.164 (ex: +5511999999999)',
          details: 'Formato inválido'
        })
        return
      }
    }
    
    setStatus('idle')
    setResponse(null)
    setCurrentStep(prev => prev + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
    window.scrollTo(0, 0)
  }

  const resetForm = () => {
    setStatus('idle')
    setResponse(null)
    setCurrentStep(1)
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
      <motion.div 
        className="form-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-header">
          <h2>Formulário de Onboarding</h2>
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <span className="step-number">
                {currentStep > 1 ? <Check size={14} /> : '1'}
              </span>
              <span className="step-label">Dados Básicos</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Negócio</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' && response && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="alert alert-success"
            >
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} className="alert-icon" />
              </div>
              <h3>Cadastro realizado com sucesso!</h3>
              <p>{response.message}</p>
              {response.integrateLink && (
                <div className="integration-info">
                  <p><strong>Token:</strong> <code>{response.token}</code></p>
                  <p><strong>Link de integração:</strong></p>
                  <a href={response.integrateLink} target="_blank" rel="noopener noreferrer" className="integrate-link">
                    Autorizar no WhatsApp <ChevronRight size={16} />
                  </a>
                  <p className="info-text">
                    ℹ️ Um link foi enviado para o WhatsApp e email informados.
                  </p>
                </div>
              )}
              <button onClick={resetForm} className="btn btn-secondary btn-full">
                Realizar Novo Cadastro
              </button>
            </motion.div>
          )}

          {status === 'error' && response && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="alert alert-error"
            >
              <h3><AlertCircle className="alert-icon" /> Erro no cadastro</h3>
              <p>{response.message}</p>
              {response.details && (
                <p className="error-details">{response.details}</p>
              )}
              <button onClick={() => setStatus('idle')} className="btn btn-secondary btn-full">
                Tentar Novamente
              </button>
            </motion.div>
          )}

          {(status === 'idle' || status === 'submitting') && (
            <form onSubmit={handleSubmit} className="onboarding-form">
              <AnimatePresence mode="wait">
                {currentStep === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="form-step-content"
                  >
                    <div className="form-group">
                      <label htmlFor="name"><Building2 size={18} /> Nome da Empresa *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={status === 'submitting'}
                        placeholder="Empresa XYZ"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="owner_name"><User size={18} /> Nome do Proprietário *</label>
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
                      <label htmlFor="owner_phone"><Phone size={18} /> Telefone (E.164) *</label>
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
                      />
                      <small>Formato oficial: +[país][DDD][número]</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="owner_email"><Mail size={18} /> Email *</label>
                      <input
                        type="email"
                        id="owner_email"
                        name="owner_email"
                        value={formData.owner_email}
                        onChange={handleChange}
                        required
                        disabled={status === 'submitting'}
                        placeholder="contato@empresa.com"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="target_country"><Globe size={18} /> País Alvo *</label>
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
                        <label htmlFor="area_code"><MapPin size={18} /> DDD/Área</label>
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
                      <label htmlFor="base_agent"><User size={18} /> Agente Base *</label>
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
                        <motion.small 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="agent-description"
                        >
                          {agents.find(a => a.id === formData.base_agent)?.description}
                        </motion.small>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="timezone"><Clock size={18} /> Timezone *</label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        required
                        disabled={status === 'submitting'}
                      >
                        <option value="">Selecione seu fuso horário</option>
                        <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="America/Los_Angeles">Los Angeles (PST)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                      </select>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        onClick={nextStep} 
                        className="btn btn-primary btn-full"
                      >
                        Próximo Passo <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="form-step-content"
                  >
                    <div className="form-section">
                      <div className="section-header">
                        <h3><Briefcase size={22} /> Perfil do Negócio</h3>
                        <p>Personalize a inteligência do seu agente</p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="business_niche"><Tag size={18} /> Nicho de Atuação *</label>
                        <input
                          type="text"
                          id="business_niche"
                          name="business_niche"
                          value={formData.business_niche}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder="Ex: Clínica Odontológica, Advocacia..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="service_area"><MapPin size={18} /> Área de Atendimento *</label>
                        <input
                          type="text"
                          id="service_area"
                          name="service_area"
                          value={formData.service_area}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder="Ex: Região Metropolitana de SP, Nacional..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="business_hours"><Clock size={18} /> Horário de Funcionamento *</label>
                        <input
                          type="text"
                          id="business_hours"
                          name="business_hours"
                          value={formData.business_hours}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder="Ex: Seg a Sex das 8h às 18h"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="services_offered"><CheckCircle2 size={18} /> Serviços Oferecidos *</label>
                        <textarea
                          id="services_offered"
                          name="services_offered"
                          value={formData.services_offered}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder="Liste os principais serviços..."
                          rows={3}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="services_not_offered"><XSquare size={18} /> Serviços NÃO Realizados *</label>
                        <textarea
                          id="services_not_offered"
                          name="services_not_offered"
                          value={formData.services_not_offered}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder="O que o agente deve dizer que não faz..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="opt-in-container">
                      <div className="opt-in-header">
                        <ShieldCheck size={22} className="opt-in-icon-lucide" />
                        <h3>Termos de Uso</h3>
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
                              Autorizo o contato via WhatsApp e SMS
                            </strong>
                            <span className="opt-in-description">
                              Declaro que aceito receber comunicações da Global Call Partners sobre minha conta e notificações.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="form-actions split">
                      <button 
                        type="button" 
                        onClick={prevStep} 
                        className="btn btn-secondary"
                        disabled={status === 'submitting'}
                      >
                        <ArrowLeft size={18} /> Voltar
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={status === 'submitting'}
                      >
                        {status === 'submitting' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Clock size={18} />
                          </motion.div>
                        ) : 'Finalizar Cadastro'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}



export default OnboardingForm
