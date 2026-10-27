import { Link } from "react-router-dom";

function VagasSalvas() {
  const vagas = [
    {
      titulo: "Desenvolvedora Front-end",
      empresa: "Bloom Tech",
      localizacao: "São Paulo • Híbrido",
      salario: "R$ 2.500 - R$ 3.500",
      area: "Tecnologia",
    },
    {
      titulo: "Desenvolvedora Júnior",
      empresa: "Tech Company",
      localizacao: "São Paulo • Remoto",
      salario: "R$ 2.800 - R$ 4.000",
      area: "Tecnologia",
    },
    {
      titulo: "Estagiária de Desenvolvimento",
      empresa: "StartUp Brasil",
      localizacao: "São Paulo • Presencial",
      salario: "R$ 1.200 - R$ 1.800",
      area: "Desenvolvimento",
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

          <Link to="/minhas-candidaturas">
            Minhas candidaturas
          </Link>

          <Link
            to="/vagas-salvas"
            className="menu-ativo"
          >
            Vagas salvas
          </Link>
        </nav>
      </aside>

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Vagas salvas</h2>
        </div>

        <div className="vagas-salvas">
          {vagas.map((vaga, index) => (
            <section
              className="perfil-card vaga-salva-card"
              key={index}
            >
              <div className="vaga-salva-info">
                <h3>{vaga.titulo}</h3>

                <p>
                  <strong>Empresa:</strong>{" "}
                  {vaga.empresa}
                </p>

                <p>
                  📍 {vaga.localizacao}
                </p>

                <p>
                  💰 {vaga.salario}
                </p>

                <p>
                  <strong>Área:</strong>{" "}
                  {vaga.area}
                </p>
              </div>

              <div className="vaga-salva-acoes">
                <span className="vaga-salva-icone">
                  ♡
                </span>

                <button className="botao-editar">
                  Ver vaga
                </button>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default VagasSalvas;