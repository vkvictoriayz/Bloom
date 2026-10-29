import { Link } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
import Icone from "../components/Icone";
import { MonogramaEmpresa } from "../components/CartaoVaga";
import { useState } from "react";

function DetalhesVaga() {
  const [candidatou, setCandidatou] = useState(false);
  const [salvou, setSalvou] = useState(false);

  function salvarVaga() {
    setSalvou(!salvou);
  }

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="inicio" />

      <main className="perfil-conteudo">
        <Link to="/vagas" className="botao-voltar">
          <Icone nome="voltar" tamanho={16} />
          Voltar para vagas
        </Link>

        <article className="perfil-card detalhes-vaga">
          <header className="vaga-detalhes-topo">
            <MonogramaEmpresa empresa="Bloom Tech" grande />

            <div className="vaga-detalhes-titulo">
              <h2>Desenvolvedora Front-end</h2>
              <p className="vaga-empresa">Bloom Tech</p>

              <ul className="vaga-meta">
                <li>
                  <Icone nome="local" tamanho={16} />
                  São Paulo
                </li>
                <li>
                  <Icone nome="salario" tamanho={16} />
                  R$ 2.500 - R$ 3.500
                </li>
              </ul>

              <div className="etiquetas">
                <span>Híbrido</span>
                <span>Tecnologia</span>
              </div>
            </div>
          </header>

          <div className="detalhes-acoes">
            <button
              type="button"
              className={`botao-principal ${candidatou ? "enviado" : ""}`}
              onClick={() => setCandidatou(true)}
              aria-live="polite"
            >
              {candidatou ? (
                <>
                  <Icone nome="check" />
                  Candidatura enviada
                </>
              ) : (
                "Candidatar-se"
              )}
            </button>

            <button
              type="button"
              className={`botao-secundario botao-salvar-texto ${salvou ? "ativo" : ""}`}
              onClick={salvarVaga}
              aria-pressed={salvou}
            >
              <Icone nome="coracao" preenchido={salvou} />
              {salvou ? "Salva" : "Salvar"}
            </button>
          </div>

          <section className="detalhes-secao">
            <h3>Sobre a vaga</h3>
            <p>
              Estamos buscando uma pessoa desenvolvedora Front-end para fazer
              parte da nossa equipe. Você irá trabalhar no desenvolvimento e
              manutenção de interfaces web.
            </p>
          </section>

          <section className="detalhes-secao">
            <h3>Requisitos</h3>
            <ul>
              <li>Conhecimento em HTML, CSS e JavaScript</li>
              <li>Conhecimento em React</li>
              <li>Git e GitHub</li>
              <li>Boa comunicação e trabalho em equipe</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}

export default DetalhesVaga;
