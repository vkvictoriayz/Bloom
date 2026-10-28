import { Link } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";

function Vagas() {
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
      <MenuLateral ativo="inicio" />

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Vagas</h2>
          <p>Encontre oportunidades que combinam com você.</p>
        </div>

        <div className="lista-vagas">
          {vagas.map((vaga, index) => (
            <section
              className="perfil-card vaga-card"
              key={index}
            >
              <div className="vaga-info">
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

              <div className="vaga-acoes">
                <button className="botao-salvar">
                  ♡
                </button>

                <Link
                  to="/vaga"
                  className="botao-editar"
                >
                  Ver vaga
                </Link>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Vagas;