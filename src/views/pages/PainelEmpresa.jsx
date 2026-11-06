import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import Logo from '../components/Logo'
import Botao from '../components/ui/Botao'
import { obterSessao, sair as sairSessao } from '../services/auth'

// Painel da empresa. Aceita a sessão real (login pelo backend, tipo "empresa")
// ou o acesso demonstrativo salvo pela tela de login da empresa.
function PainelEmpresa() {
  const navigate = useNavigate()
  const [empresa] = useState(() => {
    const sessao = obterSessao()
    if (sessao?.usuario?.tipo === 'empresa') return { ...sessao.usuario, real: true }
    try {
      return JSON.parse(sessionStorage.getItem('bloom-empresa-logada-demo') || 'null')
    } catch {
      return null
    }
  })

  // O acesso é demonstrativo e não substitui uma proteção no backend.
  if (!empresa) return <Navigate to="/empresa/login" replace />

  function sair() {
    if (empresa.real) sairSessao()
    sessionStorage.removeItem('bloom-empresa-logada-demo')
    navigate('/empresa/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-papel">
      <header className="border-b border-linha bg-branco">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="rounded-sm">
            <Logo />
          </Link>
          <Botao variante="fantasma" onClick={sair}>
            Sair da conta
          </Botao>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-xs font-semibold tracking-[0.16em] text-vinho uppercase">Área empresarial</p>
        <h1 className="mt-3 font-display text-4xl text-tinta sm:text-5xl">Olá, {empresa.nome}!</h1>
        <p className="mt-3 text-tinta-2">Você entrou na área empresarial do BLOOM com {empresa.email}.</p>

        <section className="mt-12 grid gap-px overflow-hidden rounded-xl border border-linha bg-linha sm:grid-cols-2">
          <div className="bg-branco p-8">
            <h2 className="font-display text-2xl">Perfil da empresa</h2>
            <p className="mt-2 text-sm leading-relaxed text-suave">
              Em breve, você poderá cadastrar logo, descrição, cultura e canais de contato oficiais da empresa.
            </p>
          </div>
          <div className="bg-branco p-8">
            <h2 className="font-display text-2xl">Publicação de vagas</h2>
            <p className="mt-2 text-sm leading-relaxed text-suave">
              Em breve, você poderá publicar oportunidades profissionais e acompanhar candidaturas por aqui.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Botao as={Link} to="/empresas">
            Ver empresas no BLOOM
          </Botao>
          <Botao as={Link} to="/" variante="secundario">
            Voltar à página inicial
          </Botao>
        </div>
      </main>
    </div>
  )
}

export default PainelEmpresa
