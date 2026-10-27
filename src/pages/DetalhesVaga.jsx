import { Link } from "react-router-dom";
import { useState } from "react";

function DetalhesVaga() {
  const [candidatou, setCandidatou] = useState(false);
  const [salvou, setSalvou] = useState(false);

  function salvarVaga() {
    setSalvou(!salvou);
  }

  return (
    <div className="perfil-pagina">
      <aside className="perfil-menu">
        <h1>Bloom</h1>

        <nav>
          <Link to="/home">
            Início
          </Link>

          <Link to="/perfil">
            Meu Perfil
          </Link>

          <Link to="/minhas-candidaturas">
            Minhas candidaturas
          </Link>

          <Link to="/vagas-salvas">
            Vagas salvas
          </Link>
        </nav>
      </aside>

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Desenvolvedora Front-end</h2>
          <p>Bloom Tech</p>
        </div>

        <section className="perfil-card detalhes-vaga">
          <div className="vaga-detalhes-topo">
            <div>
              <h3>Desenvolvedora Front-end</h3>

              <p>
                <strong>Empresa:</strong> Bloom Tech
              </p>

              <p>
                📍 São Paulo • Híbrido
              </p>

              <p>
                💰 R$ 2.500 - R$ 3.500
              </p>

              <p>
                <strong>Área:</strong> Tecnologia
              </p>
            </div>

            <button
              className="botao-salvar"
              onClick={salvarVaga}
            >
              {salvou ? "♥" : "♡"}
            </button>
          </div>

          <div className="detalhes-secao">
            <h3>Sobre a vaga</h3>

            <p>
              Estamos buscando uma pessoa desenvolvedora
              Front-end para fazer parte da nossa equipe.
              Você irá trabalhar no desenvolvimento e
              manutenção de interfaces web.
            </p>
          </div>

          <div className="detalhes-secao">
            <h3>Requisitos</h3>

            <ul>
              <li>Conhecimento em HTML, CSS e JavaScript</li>
              <li>Conhecimento em React</li>
              <li>Git e GitHub</li>
              <li>Boa comunicação e trabalho em equipe</li>
            </ul>
          </div>

          <div className="detalhes-acoes">
            <button
              className="botao-principal"
              onClick={() => setCandidatou(true)}
            >
              {candidatou
                ? "Candidatura enviada ✓"
                : "Candidatar-se"}
            </button>

            <Link
              to="/vagas"
              className="botao-voltar"
            >
              Voltar para vagas
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DetalhesVaga;