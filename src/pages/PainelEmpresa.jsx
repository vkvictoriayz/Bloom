import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Empresa.css'
import logoBloom from '../assets/logo-bloom.png'

function PainelEmpresa() {
  const navigate = useNavigate()
  const [empresa] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('bloom-empresa-logada-demo') || 'null'
      )
    } catch {
      return null
    }
  })

  useEffect(() => {
    // O acesso é demonstrativo e não substitui uma proteção no backend.
    if (!empresa) {
      navigate('/empresa/login', { replace: true })
    }
  }, [empresa, navigate])

  function sair() {
    sessionStorage.removeItem('bloom-empresa-logada-demo')
    navigate('/empresa/login')
  }

  if (!empresa) return null

  return (
    <main className="empresa-auth-page">
      <section className="empresa-auth-card empresa-auth-container">
        <img className="empresa-auth-logo" src={logoBloom} alt="BLOOM" />
        <p className="empresa-auth-etiqueta">ÁREA EMPRESARIAL</p>
        <h1>Olá, {empresa.nome}!</h1>
        <p className="empresa-auth-descricao">
          Você entrou na área empresarial do BLOOM.
        </p>

        <p><strong>E-mail:</strong> {empresa.email}</p>

        <p className="empresa-auth-descricao">
          Em breve, você poderá gerenciar o perfil da empresa e publicar
          oportunidades profissionais por aqui.
        </p>

        <div className="empresa-auth-form">
          <Link className="empresa-auth-botao" to="/vagas">
            Ver vagas do BLOOM
          </Link>

          <button
            className="empresa-auth-botao"
            type="button"
            onClick={sair}
          >
            Sair da conta
          </button>

          <Link className="empresa-auth-voltar" to="/">
            Voltar à página inicial
          </Link>
        </div>
      </section>
    </main>
  )
}

export default PainelEmpresa
