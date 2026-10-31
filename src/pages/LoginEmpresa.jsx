
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Empresa.css'
import logoBloom from '../assets/logo-bloom.png'

function LoginEmpresa() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState(
    location.state?.mensagem || ''
  )

  function handleSubmit(event) {
    event.preventDefault()
    setMensagem('')

    if (!email.trim() || !senha) {
      setMensagem('Preencha o e-mail e a senha.')
      return
    }

    try {
      const empresas = JSON.parse(
        localStorage.getItem('bloom-empresas-demo') || '[]'
      )

      const empresa = Array.isArray(empresas)
        ? empresas.find(
            (item) =>
              item.email === email.trim().toLowerCase() &&
              item.senha === senha
          )
        : null

      if (!empresa) {
        setMensagem('E-mail ou senha incorretos. Confira os dados ou cadastre sua empresa.')
        return
      }

      // Acesso demonstrativo: não representa autenticação segura.
      sessionStorage.setItem(
        'bloom-empresa-logada-demo',
        JSON.stringify({
          id: empresa.id,
          nome: empresa.nome,
          email: empresa.email,
        })
      )

      navigate('/empresa/painel')
    } catch {
      setMensagem('Não foi possível realizar o login. Tente novamente.')
    }
  }

  return (
    <main className="empresa-auth-page">
      <div className="empresa-auth-container">
        <Link to="/" className="empresa-auth-voltar">
          ← Voltar para o BLOOM
        </Link>

        <section className="empresa-auth-card">
          <img className="empresa-auth-logo" src={logoBloom} alt="BLOOM" />

          <p className="empresa-auth-etiqueta">ÁREA EMPRESARIAL</p>
          <h1>Bem-vinda ao BLOOM</h1>
          <p className="empresa-auth-descricao">
            Entre na sua conta empresarial para continuar.
          </p>

          <form className="empresa-auth-form" onSubmit={handleSubmit}>
            <label>
              E-mail corporativo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contato@empresa.com.br"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </label>

            {mensagem && (
              <p className="empresa-auth-mensagem" role="alert">
                {mensagem}
              </p>
            )}

            <button className="empresa-auth-botao" type="submit">
              Entrar como empresa
            </button>
          </form>

          <div className="empresa-auth-links">
            <Link to="/empresa/cadastro">Cadastrar uma empresa</Link>
            <span>
              É candidata? <Link to="/login">Acesse sua conta</Link>
            </span>
            <Link to="/">Voltar à página inicial</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginEmpresa
