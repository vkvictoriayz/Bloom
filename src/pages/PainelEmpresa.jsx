import { Link } from "react-router-dom";
import { obterSessao, sair } from "../services/auth";

// Página provisória: a área da empresa (publicar vagas etc.) ainda não existe.
function PainelEmpresa() {
  const sessao = obterSessao();

  return (
    <div className="perfil-pagina">
      <aside className="perfil-menu">
        <h1>Bloom</h1>

        <nav>
          <Link to="/empresa/painel" className="menu-ativo">
            Início
          </Link>

          <Link to="/empresa" onClick={sair}>
            Sair
          </Link>
        </nav>
      </aside>

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Olá, {sessao?.usuario.nome}! 👋</h2>
          <p>Em breve você poderá publicar vagas e acompanhar candidaturas por aqui.</p>
        </div>
      </main>
    </div>
  );
}

export default PainelEmpresa;
