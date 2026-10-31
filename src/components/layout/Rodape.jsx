import { Link } from 'react-router-dom'

import Logo from '../Logo'
import { useSessao } from '../../hooks/useSessao'

const estiloLink = 'link-linha text-sm text-white/75 transition-colors hover:text-white'

function Coluna({ titulo, children }) {
  return (
    <nav aria-label={`Rodapé: ${titulo}`} className="flex flex-col items-start gap-3">
      <h2 className="mb-1 text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">{titulo}</h2>
      {children}
    </nav>
  )
}

// Rodapé único da plataforma. Só traz links e informações que existem:
// nada de redes sociais ou endereços inventados.
function Rodape() {
  const sessao = useSessao()
  const autenticada = Boolean(sessao?.usuario)

  return (
    <footer className="bg-vinho-escuro text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo variante="clara" />
          <p className="mt-5 font-display text-2xl leading-snug text-white/90 italic">
            Conectando mulheres da tecnologia a oportunidades reais.
          </p>
        </div>

        <Coluna titulo="Plataforma">
          <Link to={autenticada ? '/vagas' : '/#areas'} className={estiloLink}>
            Vagas
          </Link>
          <Link to="/empresas" className={estiloLink}>
            Empresas
          </Link>
          {autenticada ? (
            <Link to="/contatos" className={estiloLink}>
              Contatos
            </Link>
          ) : (
            <Link to="/#como-funciona" className={estiloLink}>
              Como funciona
            </Link>
          )}
        </Coluna>

        <Coluna titulo={autenticada ? 'Sua conta' : 'Comece'}>
          {autenticada ? (
            <>
              <Link to="/perfil" className={estiloLink}>
                Meu perfil
              </Link>
              <Link to="/minhas-candidaturas" className={estiloLink}>
                Candidaturas
              </Link>
              <Link to="/vagas-salvas" className={estiloLink}>
                Vagas salvas
              </Link>
            </>
          ) : (
            <>
              <Link to="/cadastro" className={estiloLink}>
                Criar conta
              </Link>
              <Link to="/login" className={estiloLink}>
                Entrar
              </Link>
            </>
          )}
        </Coluna>

        <Coluna titulo="Para empresas">
          <Link to="/empresa/login" className={estiloLink}>
            Área da empresa
          </Link>
          <Link to="/empresa/cadastro" className={estiloLink}>
            Cadastrar empresa
          </Link>
          <a href="mailto:contato@bloom.com.br" className={estiloLink}>
            contato@bloom.com.br
          </a>
        </Coluna>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© 2026 BLOOM · Florescendo oportunidades na tecnologia.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="link-linha text-white/70 hover:text-white"
          >
            Voltar ao topo ↑
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Rodape
