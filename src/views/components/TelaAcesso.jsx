import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Icone from './Icone'
import Logo, { Borboleta } from './Logo'
import CarrosselVagas from './conta/CarrosselVagas'
import TextoDesfocado from './movimento/TextoDesfocado'
import { cn } from '../lib/cn'

const TROCAS = {
  '/login': { publico: 'candidata', candidata: '/login', empresa: '/empresa/login' },
  '/cadastro': { publico: 'candidata', candidata: '/cadastro', empresa: '/empresa/cadastro' },
  '/empresa': { publico: 'empresa', candidata: '/login', empresa: '/empresa/login' },
  '/empresa/login': { publico: 'empresa', candidata: '/login', empresa: '/empresa/login' },
  '/empresa/cadastro': { publico: 'empresa', candidata: '/cadastro', empresa: '/empresa/cadastro' },
}

const CAMPO = 'input:not([type=checkbox]):not([type=radio])'

// Estilo dos campos dentro das telas de acesso (escopo local: não muda os outros formulários do site).
const ESTILO_FORMULARIO = cn(
  '[&_input:not([type=checkbox]):not([type=radio])]:h-12 [&_input:not([type=checkbox]):not([type=radio])]:rounded-xl [&_input:not([type=checkbox]):not([type=radio])]:border-vinho-escuro/12 [&_input:not([type=checkbox]):not([type=radio])]:bg-white/60',
  '[&_select]:h-12 [&_select]:rounded-xl [&_select]:border-vinho-escuro/12 [&_select]:bg-white/60',
  '[&_input:not([type=checkbox]):not([type=radio]):hover]:border-rosa/40 [&_select:hover]:border-rosa/40',
  '[&_input:not([type=checkbox]):not([type=radio]):focus]:border-rosa [&_input:not([type=checkbox]):not([type=radio]):focus]:bg-white [&_input:not([type=checkbox]):not([type=radio]):focus]:ring-rosa/15',
  '[&_select:focus]:border-rosa [&_select:focus]:ring-rosa/15',
  '[&_input]:transition-[border-color,box-shadow,background-color] [&_input]:duration-300',
  '[&_input[aria-invalid=true]]:border-erro/60',
  '[&_button[type=submit]]:h-12 [&_button[type=submit]]:rounded-full [&_button[type=submit]]:bg-rosa [&_button[type=submit]]:shadow-[0_12px_26px_-14px_rgba(94,26,50,0.75)]',
  '[&_button[type=submit]:hover]:bg-vinho [&_button[type=submit]:disabled]:shadow-none',
  // Luz rosa que segue o cursor dentro do campo (inspirada no Input do Aceternity UI).
  '[&_input:not([type=checkbox]):not([type=radio])]:[background-image:radial-gradient(170px_circle_at_var(--luz-x,-400px)_var(--luz-y,-400px),rgba(227,161,181,0.32),transparent_72%)]'
)

function SeletorPublico({ troca }) {
  const opcoes = [
    { id: 'candidata', rotulo: 'Sou candidata', icone: 'perfil' },
    { id: 'empresa', rotulo: 'Sou empresa', icone: 'predio' },
  ]
  return (
    <nav aria-label="Tipo de conta" className="mx-auto mt-8 grid w-full grid-cols-2 rounded-full border border-vinho-escuro/10 bg-white/50 p-1">
      {opcoes.map((op) => {
        const ativo = troca.publico === op.id
        return (
          <Link
            key={op.id}
            to={troca[op.id]}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-[background-color,color] duration-300',
              ativo ? 'bg-white text-vinho-escuro shadow-[0_6px_16px_-10px_rgba(94,26,50,0.5)]' : 'text-tinta-2 hover:text-vinho-escuro'
            )}
          >
            <Icone nome={op.icone} tamanho={15} /> {op.rotulo}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Moldura das telas de acesso (login, cadastro, recuperação de senha…).
 * Esquerda: marca BLOOM (como na página inicial) + formulário. Direita: vagas em destaque sobre a borboleta.
 * ocultarTitulo: o h1 fica só para leitores de tela (no login, a marca já faz o papel de título visual).
 */
function TelaAcesso({ titulo, subtitulo, etiqueta, aoEnviar, children, rodape, semFormulario = false, ocultarTitulo = false }) {
  const { pathname } = useLocation()
  const troca = TROCAS[pathname]

  useEffect(() => {
    document.title = `${titulo} · BLOOM`
  }, [titulo])

  // Posição do cursor dentro do campo apontado, para a luz rosa acompanhar o mouse.
  const campoIluminado = useRef(null)
  function apagarLuz() {
    campoIluminado.current?.style.removeProperty('--luz-x')
    campoIluminado.current?.style.removeProperty('--luz-y')
    campoIluminado.current = null
  }
  function iluminarCampo(evento) {
    const campo = evento.target.closest?.(CAMPO)
    if (campo !== campoIluminado.current) apagarLuz()
    if (!campo) return
    const r = campo.getBoundingClientRect()
    campo.style.setProperty('--luz-x', `${evento.clientX - r.left}px`)
    campo.style.setProperty('--luz-y', `${evento.clientY - r.top}px`)
    campoIluminado.current = campo
  }

  function enviar(evento) {
    evento.preventDefault()
    aoEnviar?.()
  }

  const conteudo = semFormulario ? (
    <div className="mt-7 flex flex-col gap-5">{children}</div>
  ) : (
    <form className={cn('mt-7 flex flex-col gap-4', ESTILO_FORMULARIO)} onSubmit={enviar} onPointerMove={iluminarCampo} onPointerLeave={apagarLuz} noValidate>
      {children}
    </form>
  )

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[linear-gradient(120deg,#fbf5f7_0%,#f8ecef_45%,#f1dce3_100%)]">
      {/* Borboleta da Bloom grande e translúcida, como no topo da página inicial */}
      <Borboleta
        tamanho={100}
        className="pointer-events-none absolute top-[4%] -right-[30vw] -z-10 h-auto w-[95vw] rotate-[-8deg] text-[#d98ba3] opacity-[0.16] lg:top-[3%] lg:-right-[3vw] lg:w-[min(56vw,118vh)] lg:max-w-none lg:opacity-[0.22]"
      />

      <header className="flex h-20 items-center justify-between px-6 sm:px-12 lg:h-24">
        <Link to="/" className="rounded-sm" title="Voltar para a página inicial">
          <Logo />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-tinta-2 transition-colors hover:text-vinho-escuro lg:hidden">
          <Icone nome="voltar" tamanho={16} /> Início
        </Link>
      </header>

      <div className="mx-auto grid max-w-[92rem] gap-10 px-6 pb-16 sm:px-12 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:gap-20 xl:gap-32">
        <main className="mx-auto w-full max-w-[25rem] lg:mx-0 lg:pt-2">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-vinho-escuro/80 uppercase">A rede das mulheres da tecnologia</p>
            <p aria-hidden="true" className="mt-3 font-display text-[3.6rem] leading-none font-medium tracking-[0.06em] text-vinho-escuro sm:text-[4.4rem]">
              BLOOM
            </p>
            <p className="mx-auto mt-4 max-w-[18rem] text-[17px] leading-snug text-tinta-2">Vagas, comunidade e candidaturas acompanhadas, num só lugar.</p>
          </div>

          {troca && <SeletorPublico troca={troca} />}

          <div className={cn('mt-8', ocultarTitulo && 'sr-only')}>
            {etiqueta && <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-rosa uppercase">{etiqueta}</p>}
            <h1 className="font-display text-[1.75rem] leading-tight text-tinta">
              <TextoDesfocado key={titulo} texto={titulo} />
            </h1>
            {subtitulo && <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-2">{subtitulo}</p>}
          </div>

          {conteudo}

          {rodape && <div className="mt-7 flex flex-col items-center gap-2 text-center text-sm text-tinta-2">{rodape}</div>}

          <p className="mt-8 text-center text-xs text-suave">
            <Link to="/termos" className="hover:text-vinho hover:underline">
              Termos de Uso
            </Link>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <Link to="/privacidade" className="hover:text-vinho hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </main>

        {/* Computador: vagas em destaque passando sobre a borboleta */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex min-h-[calc(100vh-8rem)] items-center">
            <CarrosselVagas />
          </div>
        </aside>
      </div>
    </div>
  )
}

export function GrupoCampos({ indice, titulo, children }) {
  return (
    <fieldset className="mt-2 flex flex-col gap-4">
      <legend className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-tinta">
        <span className="grid size-7 place-items-center rounded-full bg-white/70 text-xs text-vinho-escuro">{indice}</span>
        {titulo}
      </legend>
      {children}
    </fieldset>
  )
}

export function LinkAcesso({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-vinho-escuro underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

export default TelaAcesso
