import { Link } from "react-router-dom";

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
      <aside className="perfil-menu">
        <h1>Bloom</h1>

        <nav>
          <Link to="/perfil">
            Meu Perfil
          </Link>

          <Link
            to="/candidaturas"
            className="menu-ativo"
          >
            Minhas candidaturas
          </Link>

          <Link to="/vagas-salvas">
            Vagas salvas
          </Link>
        </nav>
      </aside>

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Minhas candidaturas</h2>
        </div>

        <div className="candidaturas">
          {candidaturas.map((candidatura, index) => (
            <section
              className="perfil-card candidatura-card"
              key={index}
            >
              <div className="candidatura-info">
                <h3>{candidatura.vaga}</h3>

                <p>
                  <strong>Empresa:</strong>{" "}
                  {candidatura.empresa}
                </p>

                <p>
                  📍 {candidatura.localizacao}
                </p>

                <p>
                  <strong>Data da candidatura:</strong>{" "}
                  {candidatura.data}
                </p>
              </div>

              <div className="candidatura-status">
                <span>{candidatura.status}</span>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default MinhasCandidaturas;