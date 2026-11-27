import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Logo from '../Logo'
import BorboletaDecorativa from '../borboleta/BorboletaDecorativa'
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
      <h2 className="text-xs font-semibold tracking-[0.28em] text-rosa uppercase">{titulo}</h2>
      <ul className="mt-5 flex flex-col gap-3">{children}</ul>
    </nav>
  )
}

function Rodape() {
  const sessao = useSessao()
  const empresa = sessao?.usuario?.tipo === 'empresa'
  const autenticada = Boolean(sessao?.usuario) && !empresa

  return (
    <footer className="relative isolate w-full overflow-hidden border-t border-rosa/10 bg-white text-tinta">
      <BorboletaDecorativa className="-right-20 -bottom-24 -z-10 hidden w-[26rem] sm:block" opacidade={0.22} rotacao={-12} ritmo="7s" duracaoFlutuar="12s" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid gap-10 pt-10 pb-12 sm:gap-12 sm:pt-12 sm:pb-14 lg:grid-cols-[1.4fr_2fr] lg:gap-20 lg:pt-14">
          <div className="max-w-md">
            <Logo />
            <p className="mt-6 font-display text-[1.7rem] leading-snug text-tinta sm:text-3xl">
              Conectando mulheres da tecnologia a <em className="text-vinho">oportunidades reais.</em>
            </p>
            <a
              href="mailto:contato@bloom.com.br"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-rosa/15 bg-white/70 py-2 pr-4 pl-2 text-sm text-tinta-2 transition-colors duration-300 hover:border-rosa/40 hover:text-vinho-escuro"
            >
              <span className="grid size-7 place-items-center rounded-full bg-rosa text-white" aria-hidden="true">
                <Icone nome="email" tamanho={14} />
              </span>
              contato@bloom.com.br
            </a>
          </div>

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

        <div className="flex flex-col-reverse items-start justify-between gap-4 border-t border-rosa/10 py-6 text-xs text-suave sm:flex-row sm:items-center">
          <p>© 2026 BLOOM · Florescendo oportunidades na tecnologia.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 text-tinta-2 transition-colors hover:text-vinho"
          >
            Voltar ao topo
            <span className="grid size-8 place-items-center rounded-full border border-rosa/30 transition-colors duration-300 group-hover:border-rosa group-hover:bg-rosa group-hover:text-white">
              <Icone nome="seta" tamanho={14} className="-rotate-90" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Rodape
