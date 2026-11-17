import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Logo, { Borboleta } from '../Logo'
import { useSessao } from '../../hooks/useSessao'

const estiloLink = 'group inline-flex w-fit items-center gap-1.5 text-sm text-tinta-2 sm:text-[15px] transition-colors hover:text-vinho'

function ItemLink({ para, children }) {
  return (
    <li>
      <Link to={para} className={estiloLink}>
        {children}
        <Icone
          nome="seta"
          tamanho={14}
          className="-translate-x-1 opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:hidden"
        />
      </Link>
    </li>
  )
}

function Coluna({ titulo, children }) {
  return (
    <nav aria-label={`Rodapé: ${titulo}`}>
      <h2 className="text-xs font-bold tracking-[0.16em] text-suave uppercase">{titulo}</h2>
      <ul className="mt-5 flex flex-col gap-3">{children}</ul>
    </nav>
  )
}

// Rodapé único das páginas públicas. Cartão claro com cantos arredondados,
// na mesma largura e no mesmo estilo dos cartões da Home, com a borboleta da
// marca em marca-d'água rosada e só links
// e informações que existem: nada de redes sociais ou endereços inventados.
function Rodape() {
  const sessao = useSessao()
  const empresa = sessao?.usuario?.tipo === 'empresa'
  // A empresa logada vê os atalhos da área dela, não os da candidata.
  const autenticada = Boolean(sessao?.usuario) && !empresa

  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
      <div className="relative isolate overflow-hidden rounded-2xl border border-linha bg-branco text-tinta">
        {/* Marca-d'água: a borboleta grande, recortada no canto */}
        <Borboleta tamanho={480} className="pointer-events-none absolute -right-24 -bottom-28 -z-10 rotate-[-12deg] text-blush/70 max-sm:hidden" />

        <div className="grid gap-10 px-6 pt-10 pb-10 sm:gap-12 sm:px-10 sm:pt-14 sm:pb-12 lg:grid-cols-[1.4fr_2fr] lg:gap-16 lg:px-14 lg:pt-16">
          {/* Marca */}
          <div className="max-w-md">
            <Logo />
            <p className="mt-6 font-display text-[1.7rem] leading-snug text-tinta sm:text-3xl">
              Conectando mulheres da tecnologia a <em className="text-vinho">oportunidades reais.</em>
            </p>
            <a
              href="mailto:contato@bloom.com.br"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-linha bg-papel py-2 pr-4 pl-2 text-sm text-tinta-2 transition-colors hover:border-linha-forte hover:text-vinho"
            >
              <span className="grid size-7 place-items-center rounded-full bg-vinho text-white" aria-hidden="true">
                <Icone nome="email" tamanho={14} />
              </span>
              contato@bloom.com.br
            </a>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10">
            <Coluna titulo="Plataforma">
              <ItemLink para={autenticada ? '/candidata/vagas' : '/#areas'}>Vagas</ItemLink>
              <ItemLink para="/empresas">Empresas</ItemLink>
              {autenticada ? <ItemLink para="/candidata/mensagens">Mensagens</ItemLink> : <ItemLink para="/#como-funciona">Como funciona</ItemLink>}
            </Coluna>

            {!empresa && (
              <Coluna titulo={autenticada ? 'Sua conta' : 'Comece'}>
                {autenticada ? (
                  <>
                    <ItemLink para="/candidata/perfil">Meu perfil</ItemLink>
                    <ItemLink para="/candidata/candidaturas">Candidaturas</ItemLink>
                    <ItemLink para="/candidata/vagas-salvas">Vagas salvas</ItemLink>
                  </>
                ) : (
                  <>
                    <ItemLink para="/cadastro">Criar conta</ItemLink>
                    <ItemLink para="/login">Entrar</ItemLink>
                  </>
                )}
              </Coluna>
            )}

            <Coluna titulo="Para empresas">
              {empresa ? (
                <>
                  <ItemLink para="/empresa/feed">Área da empresa</ItemLink>
                  <ItemLink para="/empresa/vagas">Gerenciar vagas</ItemLink>
                </>
              ) : (
                <>
                  <ItemLink para="/empresa/login">Área da empresa</ItemLink>
                  <ItemLink para="/empresa/cadastro">Cadastrar empresa</ItemLink>
                </>
              )}
            </Coluna>
          </div>
        </div>

        <div className="mx-6 flex flex-col-reverse items-start justify-between gap-4 border-t border-linha py-6 text-xs text-suave sm:mx-10 sm:flex-row sm:items-center lg:mx-14">
          <p>© 2026 BLOOM · Florescendo oportunidades na tecnologia.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 text-tinta-2 transition-colors hover:text-vinho"
          >
            Voltar ao topo
            <span className="grid size-8 place-items-center rounded-full border border-linha-forte transition-colors group-hover:border-vinho group-hover:bg-vinho group-hover:text-white">
              <Icone nome="seta" tamanho={14} className="-rotate-90" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Rodape
