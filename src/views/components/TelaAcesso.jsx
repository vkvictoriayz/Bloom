import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Icone from './Icone'
import Logo, { Borboleta } from './Logo'
import CenaAcesso from './borboleta/CenaAcesso'
import { CENA_ESCURA, FUNDO_CENA } from './borboleta/cenas'
import { IlustracaoCodigo, IlustracaoConexoes, IlustracaoEmpresa } from './ilustracoes/Ilustracoes'
import { cn } from '../lib/cn'

const ILUSTRACOES = {
  codigo: IlustracaoCodigo,
  conexoes: IlustracaoConexoes,
  empresa: IlustracaoEmpresa,
}

const VISUAL_PADRAO = {
  ilustracao: 'codigo',
  frase: 'Florescer é voltar para você.',
  itens: [],
}

const TROCAS = {
  '/login': { publico: 'candidata', candidata: '/login', empresa: '/empresa/login' },
  '/cadastro': { publico: 'candidata', candidata: '/cadastro', empresa: '/empresa/cadastro' },
  '/empresa': { publico: 'empresa', candidata: '/login', empresa: '/empresa/login' },
  '/empresa/login': { publico: 'empresa', candidata: '/login', empresa: '/empresa/login' },
  '/empresa/cadastro': { publico: 'empresa', candidata: '/cadastro', empresa: '/empresa/cadastro' },
}

function SeletorPublico({ troca }) {
  const opcoes = [
    { id: 'candidata', rotulo: 'Sou candidata', icone: 'perfil' },
    { id: 'empresa', rotulo: 'Sou empresa', icone: 'predio' },
  ]
  return (
    <nav aria-label="Tipo de conta" className="mb-8 flex w-fit rounded-full border border-linha bg-papel p-1">
      {opcoes.map((op) => {
        const ativo = troca.publico === op.id
        return (
          <Link
            key={op.id}
            to={troca[op.id]}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors',
              ativo ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
            )}
          >
            <Icone nome={op.icone} tamanho={16} /> {op.rotulo}
          </Link>
        )
      })}
    </nav>
  )
}

function TelaAcesso({ titulo, subtitulo, etiqueta, aoEnviar, children, rodape, visual = {} }) {
  const { ilustracao, imagem, frase, itens, cena } = { ...VISUAL_PADRAO, ...visual }
  const escura = CENA_ESCURA.has(cena)
  const Ilustracao = ILUSTRACOES[ilustracao] ?? IlustracaoCodigo
  const { pathname } = useLocation()
  const troca = TROCAS[pathname]

  useEffect(() => {
    document.title = `${titulo} · BLOOM`
  }, [titulo])

  function enviar(evento) {
    evento.preventDefault()
    aoEnviar()
  }

  return (
    <div className="flex min-h-screen flex-col bg-papel">
      <header className="border-b border-linha bg-branco">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="rounded-sm" title="Voltar para a página inicial">
            <Logo />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-tinta-2 hover:bg-papel-2 hover:text-tinta">
            <Icone nome="voltar" tamanho={16} /> Início
          </Link>
        </div>
      </header>

      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:py-12">
        <Borboleta tamanho={520} className="pointer-events-none absolute -right-28 -bottom-32 -z-10 rotate-[-12deg] text-blush/70 max-sm:hidden" />
        <Borboleta tamanho={260} className="pointer-events-none absolute -top-10 -left-16 -z-10 rotate-[14deg] text-blush/50 max-lg:hidden" />
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-linha bg-branco lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <section className="animar-entrada px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
            {troca && <SeletorPublico troca={troca} />}
            {cena ? (
              <CenaAcesso variante={cena} compacta className="mb-6 h-44 rounded-xl lg:hidden" />
            ) : imagem ? (
              <img src={imagem} alt="" className="mb-6 h-40 w-full rounded-xl bg-papel object-cover lg:hidden" width="1024" height="1536" />
            ) : (
              <div className="mb-6 rounded-xl bg-papel px-6 py-4 lg:hidden">
                <Ilustracao className="mx-auto max-w-[260px]" />
              </div>
            )}
            {etiqueta && <p className="mb-2 text-xs font-bold tracking-[0.16em] text-vinho uppercase">{etiqueta}</p>}
            <h1 className="font-display text-3xl leading-tight text-tinta sm:text-[2.4rem]">{titulo}</h1>
            {subtitulo && <p className="mt-2 text-[15px] text-suave">{subtitulo}</p>}

            <form className="mt-8 flex flex-col gap-5" onSubmit={enviar} noValidate>
              {children}
            </form>

            {rodape && <div className="mt-8 flex flex-col gap-2 border-t border-linha pt-6 text-sm text-tinta-2">{rodape}</div>}
          </section>

          <aside className="hidden p-3 lg:block">
            {cena ? (
              <div className="sticky top-6 flex h-[min(620px,calc(100dvh-3rem))] min-h-[520px] flex-col justify-end overflow-hidden rounded-xl">
                <CenaAcesso variante={cena} className="absolute inset-0" />
                <div className="relative px-8 pt-20 pb-9" style={{ backgroundImage: `linear-gradient(to top, ${FUNDO_CENA[cena] ?? '#fbf7f4'} 45%, transparent)` }}>
                  <p className={cn('max-w-sm font-display text-3xl leading-tight', escura ? 'text-white' : 'text-vinho-escuro')}>{frase}</p>
                </div>
              </div>
            ) : (
            <div className="flex h-full min-h-[560px] flex-col justify-between rounded-xl bg-papel p-8">
              {imagem ? (
                <div className="relative -mx-8 -mt-8 mb-6 min-h-[320px] flex-1 overflow-hidden rounded-t-xl">
                  <img
                    src={imagem}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: 'center 45%' }}
                    width="1024"
                    height="1536"
                  />
                </div>
              ) : (
                <Ilustracao className="mx-auto max-w-[400px]" />
              )}
              <div>
                <p className="max-w-sm font-display text-3xl leading-tight text-vinho-escuro italic">{frase}</p>
                {itens.length > 0 && (
                  <ul className="mt-5 flex flex-col gap-2 text-sm text-tinta-2">
                    {itens.map((item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-vinho text-white">
                          <Icone nome="check" tamanho={12} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

export function GrupoCampos({ indice, titulo, children }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-4 flex w-full items-center gap-3 text-xs font-bold tracking-[0.14em] text-suave uppercase">
        <span className="grid size-6 place-items-center rounded-full bg-blush text-[11px] text-vinho">{indice}</span>
        {titulo}
        <span aria-hidden="true" className="h-px flex-1 bg-linha" />
      </legend>
      {children}
    </fieldset>
  )
}

export function LinkAcesso({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-vinho underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

export default TelaAcesso
