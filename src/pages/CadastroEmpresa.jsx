
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Empresa.css'
import logoBloom from '../assets/logo-bloom.png'

function CadastroEmpresa() {
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMensagem('')

    if (!nome.trim() || !cnpj.trim() || !email.trim() || !senha) {
      setMensagem('Preencha todos os campos.')
      return
    }

    if (senha.length < 8) {
      setMensagem('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setMensagem('As senhas não coincidem.')
      return
    }

    try {
      const empresas = JSON.parse(
        localStorage.getItem('bloom-empresas-demo') || '[]'
      )

      if (!Array.isArray(empresas)) {
        setMensagem('Não foi possível ler os cadastros. Tente novamente.')
        return
      }

      const emailNormalizado = email.trim().toLowerCase()
      const cnpjNormalizado = cnpj.replace(/\D/g, '')

      if (empresas.some((empresa) => empresa.email === emailNormalizado)) {
        setMensagem('Já existe uma conta com esse e-mail.')
        return
      }

      if (cnpjNormalizado.length !== 14) {
        setMensagem('Informe um CNPJ com 14 números.')
        return
      }

      if (empresas.some((empresa) => empresa.cnpj === cnpjNormalizado)) {
        setMensagem('Já existe uma conta com esse CNPJ.')
        return
      }

      empresas.push({
        id: Date.now(),
        nome: nome.trim(),
        cnpj: cnpjNormalizado,
        email: emailNormalizado,
        senha,
      })

      localStorage.setItem('bloom-empresas-demo', JSON.stringify(empresas))

      navigate('/empresa/login', {
        state: { mensagem: 'Cadastro demonstrativo realizado! Entre com sua conta.' },
      })
    } catch {
      setMensagem('Não foi possível concluir o cadastro neste navegador.')
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

          <p className="empresa-auth-etiqueta">PARA EMPREGADORES</p>
          <h1>Cadastre sua empresa</h1>
          <p className="empresa-auth-descricao">
            Faça parte do BLOOM e prepare-se para conectar sua empresa a
            talentos da tecnologia.
          </p>

          <form className="empresa-auth-form" onSubmit={handleSubmit}>
            <label>
              Nome da empresa
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Empresa Tecnologia Ltda."
                autoComplete="organization"
                required
              />
            </label>

            <label>
              CNPJ
              <input
                value={cnpj}
                onChange={(event) => setCnpj(event.target.value)}
                placeholder="Digite os 14 números do CNPJ"
                inputMode="numeric"
                maxLength={18}
                required
              />
            </label>

            <label>
              E-mail corporativo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contato@empresa.com.br"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              Confirmar senha
              <input
                type="password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                required
              />
            </label>

            {mensagem && (
              <p className="empresa-auth-mensagem" role="alert">
                {mensagem}
              </p>
            )}

            <button className="empresa-auth-botao" type="submit">
              Criar conta empresarial
            </button>
          </form>

          <div className="empresa-auth-links">
            <span>
              Já possui uma conta? <Link to="/empresa/login">Entrar</Link>
            </span>
            <span>
              É candidata? <Link to="/">Acesse sua conta</Link>
            </span>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CadastroEmpresa
