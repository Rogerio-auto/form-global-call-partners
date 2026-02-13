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
  country_code: string
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
    country_code: '+1',
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

  const getFullPhoneNumber = (): string => {
    // Remove espaços, hífens e parênteses do número
    const cleanPhone = formData.owner_phone.replace(/[\s\-\(\)]/g, '')
    // Se o número já começa com +, retorna ele
    if (cleanPhone.startsWith('+')) {
      return cleanPhone
    }
    // Caso contrário, combina código do país + número
    return `${formData.country_code}${cleanPhone}`
  }

  const formatPhoneNumber = (value: string, countryCode: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Formatação por país
    switch (countryCode) {
      case '+55': // Brasil
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
        if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
      
      case '+1': // EUA/Canadá
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
      
      case '+52': // México
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 6) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
      
      case '+54': // Argentina
      case '+56': // Chile
      case '+57': // Colombia
      case '+51': // Peru
        if (numbers.length <= 1) return numbers
        if (numbers.length <= 5) return `${numbers.slice(0, 1)} ${numbers.slice(1)}`
        return `${numbers.slice(0, 1)} ${numbers.slice(1, 5)}-${numbers.slice(5, 9)}`
      
      case '+34': // Espanha
      case '+351': // Portugal
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`
      
      case '+44': // Reino Unido
        if (numbers.length <= 4) return numbers
        if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`
        return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`
      
      default:
        // Formatação genérica para outros países
        if (numbers.length <= 4) return numbers
        if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`
    }
  }

  const getPhonePlaceholder = (countryCode: string): string => {
    const placeholders: { [key: string]: string } = {
      '+1': '(555) 123-4567',
      '+52': '55 1234-5678',
      '+55': '(11) 99999-9999',
      '+54': '9 1234-5678',
      '+56': '9 1234-5678',
      '+57': '3 1234-5678',
      '+51': '9 1234-5678',
      '+58': '412 123-4567',
      '+34': '612 345 678',
      '+351': '912 345 678',
      '+44': '7700 123456',
      '+33': '612 345 678',
      '+49': '151 12345678',
      '+39': '312 345 6789',
      '+41': '78 123 45 67',
      '+31': '612 345 678',
      '+32': '470 12 34 56',
      '+61': '412 345 678',
      '+64': '21 123 4567',
      '+81': '90 1234 5678',
      '+86': '138 0013 8000',
      '+91': '98765 43210'
    }
    return placeholders[countryCode] || '123456789'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    // Formatação especial para o campo de telefone
    if (name === 'owner_phone') {
      const formatted = formatPhoneNumber(value, formData.country_code)
      setFormData(prev => ({
        ...prev,
        owner_phone: formatted
      }))
      return
    }
    
    // Se mudou o código do país, reformata o número existente
    if (name === 'country_code' && formData.owner_phone) {
      const formatted = formatPhoneNumber(formData.owner_phone, value)
      setFormData(prev => ({
        ...prev,
        country_code: value,
        owner_phone: formatted
      }))
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const fullPhoneNumber = getFullPhoneNumber()
    
    // Validação básica
    if (!validateE164(fullPhoneNumber)) {
      setStatus('error')
      setResponse({
        success: false,
        message: 'Telefone inválido. Verifique o código do país e o número.',
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
        body: JSON.stringify({
          ...formData,
          owner_phone: fullPhoneNumber
        })
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
      
      const fullPhoneNumber = getFullPhoneNumber()
      if (!validateE164(fullPhoneNumber)) {
        setStatus('error')
        setResponse({
          success: false,
          message: 'Telefone inválido. Verifique o código do país e o número.',
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
      country_code: '+1',
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
                      <label htmlFor="owner_phone"><Phone size={18} /> Telefone *</label>
                      <div className="phone-input-group">
                        <select
                          id="country_code"
                          name="country_code"
                          value={formData.country_code}
                          onChange={handleChange}
                          disabled={status === 'submitting'}
                          className="country-code-select"
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+52">🇲🇽 +52</option>
                          <option value="+55">🇧🇷 +55</option>
                          <option value="+54">🇦🇷 +54</option>
                          <option value="+56">🇨🇱 +56</option>
                          <option value="+57">🇨🇴 +57</option>
                          <option value="+51">🇵🇪 +51</option>
                          <option value="+58">🇻🇪 +58</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+351">🇵🇹 +351</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+39">🇮🇹 +39</option>
                          <option value="+41">🇨🇭 +41</option>
                          <option value="+31">🇳🇱 +31</option>
                          <option value="+32">🇧🇪 +32</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+64">🇳🇿 +64</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+86">🇨🇳 +86</option>
                          <option value="+91">🇮🇳 +91</option>
                        </select>
                        <input
                          type="tel"
                          id="owner_phone"
                          name="owner_phone"
                          value={formData.owner_phone}
                          onChange={handleChange}
                          required
                          disabled={status === 'submitting'}
                          placeholder={getPhonePlaceholder(formData.country_code)}
                          className="phone-number-input"
                        />
                      </div>
                      <small>
                        Formato: {getPhonePlaceholder(formData.country_code)}
                        {formData.owner_phone && (
                          <span className="phone-preview"> → Número completo: {formData.country_code} {formData.owner_phone}</span>
                        )}
                      </small>
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
