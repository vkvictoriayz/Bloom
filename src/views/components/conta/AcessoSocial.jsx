import { useEffect, useState } from 'react'

import { Aviso } from '../ui/Campo'
import { limparFragmento } from '../../utils/oauth'

function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8Z" />
    </svg>
  )
}

function LogoGithub() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  )
}

// Lê a mensagem de erro devolvida pelo login social no fragmento da URL (#erro=…).
const lerErroDaUrl = () => new URLSearchParams(window.location.hash.slice(1)).get('erro') ?? ''

const BOTAO =
  'inline-flex h-12 w-full shrink-0 items-center justify-center gap-3 rounded-full text-[15px] font-semibold transition-[background-color,border-color,box-shadow] duration-300 focus-visible:ring-[3px] focus-visible:ring-rosa/25 focus-visible:outline-none'
const CHEIO = 'bg-rosa text-white shadow-[0_12px_26px_-14px_rgba(94,26,50,0.75)] hover:bg-vinho'
const CONTORNO = 'border border-vinho-escuro/20 bg-white/40 text-vinho-escuro hover:border-rosa/50 hover:bg-white/80'

// Botões "Continuar com Google/GitHub". O navegador vai até a API, que redireciona para o provedor.
// acao: "entrar" (login) ou "cadastrar" (cadastro), só muda o texto dos botões.
function AcessoSocial({ tipo = 'usuaria', acao = 'entrar', textoDivisor = 'ou' }) {
  const verbo = acao === 'cadastrar' ? 'Criar conta com o' : 'Entrar com o'
  const [erro] = useState(lerErroDaUrl)
  useEffect(() => {
    if (erro) limparFragmento()
  }, [erro])
  const link = (provedor) => `/api/auth/oauth/${provedor}/iniciar?tipo=${tipo}`

  return (
    <div className="flex flex-col gap-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-col gap-3">
        <a href={link('google')} className={`${BOTAO} ${CHEIO}`}>
          <span className="grid size-7 place-items-center rounded-full bg-white">
            <LogoGoogle />
          </span>
          {verbo} Google
        </a>
        <a href={link('github')} className={`${BOTAO} ${CONTORNO}`}>
          <LogoGithub /> {verbo} GitHub
        </a>
      </div>
      <div className="flex items-center gap-3 text-xs text-suave">
        <span className="h-px flex-1 bg-vinho-escuro/10" aria-hidden="true" />
        {textoDivisor}
        <span className="h-px flex-1 bg-vinho-escuro/10" aria-hidden="true" />
      </div>
    </div>
  )
}

export default AcessoSocial
