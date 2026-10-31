
import { useState } from 'react'
import { Link } from 'react-router-dom'
import imagemLogin from '../assets/login.png'
import logoBloom from '../assets/logo-bloom.png'
import './Auth.css'

function RecuperarSenha() {
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()

    if (!email.trim()) {
      alert('Digite seu e-mail.')
      return
    }

    alert('Solicitação recebida! A recuperação por e-mail será ativada quando conectarmos o backend.')
  }

  return (
    <main className="auth-page recovery-page">
      <section className="auth-form-side">
        <div className="auth-form-container recovery-container">
          <Link to="/" className="auth-brand">
            <img
              src={logoBloom}
              alt="Logo BLOOM"
              className="auth-logo"
            />
          </Link>

          <div className="auth-heading">
            <h1>Recuperar senha</h1>
            <p>
              Não se preocupe! Informe o e-mail da sua conta
              para iniciar a recuperação de acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit">
              Recuperar senha
            </button>
          </form>

          <p className="auth-switch">
            Lembrou sua senha?{' '}
            <Link to="/">Voltar ao login</Link>
          </p>
        </div>
      </section>

      <aside className="auth-image-side">
        <img src={imagemLogin} alt="Mulheres que florescem na tecnologia" />
      </aside>
    </main>
  )
}

export default RecuperarSenha
