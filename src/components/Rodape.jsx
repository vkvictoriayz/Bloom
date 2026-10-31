import { Link } from 'react-router-dom'

import { obterSessao } from '../services/auth'
import logoBloom from '../assets/logo-bloom.png'
import './Layout.css'

function Rodape() {
  const autenticada = Boolean(obterSessao()?.usuario)
  const privada = (rota) => (autenticada ? rota : '/login')

  return (
    <footer className="rodape" id="contato">
      <div className="rodape-interno">
        <div className="rodape-marca">
          <Link to="/" className="cabecalho-logo" aria-label="BLOOM, página inicial">
            <img src={logoBloom} alt="" />
            <span>BLOOM</span>
          </Link>
          <p>
            Uma plataforma que conecta mulheres a oportunidades,
            empresas e novos caminhos na tecnologia.
          </p>
        </div>

        <nav className="rodape-coluna" aria-label="Rodapé: navegue">
          <h2>Navegue</h2>
          <Link to="/">Início</Link>
          <Link to={privada('/vagas')}>Vagas</Link>
          <Link to={privada('/perfil')}>Meu perfil</Link>
          <Link to={privada('/vagas-salvas')}>Vagas salvas</Link>
        </nav>

        <nav className="rodape-coluna" aria-label="Rodapé: empresas">
          <h2>Empresas</h2>
          <Link to="/empresa/login">Área da empresa</Link>
          <Link to="/empresa/cadastro">Cadastrar empresa</Link>
        </nav>

        <div className="rodape-coluna">
          <h2>Contato</h2>
          <a href="mailto:contato@bloom.com.br">contato@bloom.com.br</a>
        </div>
      </div>

      <div className="rodape-final">
        <span>© 2026 BLOOM · Florescendo oportunidades na tecnologia.</span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑ Voltar ao topo
        </button>
      </div>
    </footer>
  )
}

export default Rodape
