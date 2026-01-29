import OnboardingForm from './components/OnboardingForm'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Global Call Partners</h1>
        <p>Integração WhatsApp Business API</p>
      </header>
      <main className="app-main">
        <OnboardingForm />
      </main>
    </div>
  )
}

export default App
