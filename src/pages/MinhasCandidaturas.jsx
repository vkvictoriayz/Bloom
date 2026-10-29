import { Link } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
import Icone from "../components/Icone";
import { MonogramaEmpresa } from "../components/CartaoVaga";
import { separarLocalizacao } from "../utils/vagas";

// Cor do selo de acordo com a etapa da candidatura.
const ESTILO_STATUS = {
  "Candidatura enviada": "status-enviada",
  "Em análise": "status-analise",
  Entrevista: "status-entrevista",
};

function MinhasCandidaturas() {
  const candidaturas = [
    {
      vaga: "Desenvolvedora Front-end",
      empresa: "Bloom Tech",
      localizacao: "São Paulo • Híbrido",
      status: "Em análise",
      data: "20/09/2026",
    },
    {
      vaga: "Desenvolvedora Júnior",
      empresa: "Tech Company",
      localizacao: "São Paulo • Remoto",
      status: "Entrevista",
      data: "18/09/2026",
    },
    {
      vaga: "Estagiária de Desenvolvimento",
      empresa: "StartUp Brasil",
      localizacao: "São Paulo • Presencial",
      status: "Candidatura enviada",
      data: "15/09/2026",
    },
  ];

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="candidaturas" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Minhas candidaturas</h2>
          <p className="subtitulo">Acompanhe cada etapa dos seus processos.</p>
        </header>

        <div className="candidaturas">
          {candidaturas.map((candidatura, index) => {
            const { cidade, modalidade } = separarLocalizacao(candidatura.localizacao);

            return (
              <article className="perfil-card candidatura-card" key={index}>
                <MonogramaEmpresa empresa={candidatura.empresa} />

                <div className="candidatura-info">
                  <h3>
                    <Link to="/vaga">{candidatura.vaga}</Link>
                  </h3>
                  <p className="vaga-empresa">{candidatura.empresa}</p>

                  <ul className="vaga-meta">
                    <li>
                      <Icone nome="local" tamanho={16} />
                      {modalidade ? `${cidade}, ${modalidade.toLowerCase()}` : cidade}
                    </li>
                    <li>
                      <Icone nome="calendario" tamanho={16} />
                      Enviada em {candidatura.data}
                    </li>
                  </ul>
                </div>

                <div className="candidatura-status">
                  <span className={ESTILO_STATUS[candidatura.status] ?? "status-enviada"}>
                    {candidatura.status}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default MinhasCandidaturas;
