import MenuLateral from "../components/MenuLateral";
import CartaoVaga from "../components/CartaoVaga";

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
      <MenuLateral ativo="salvas" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Vagas salvas</h2>
          <p className="subtitulo">As oportunidades que você guardou para ver com calma.</p>
        </header>

        <div className="lista-vagas vagas-salvas">
          {vagas.map((vaga, index) => (
            <CartaoVaga key={index} vaga={vaga} salva />
          ))}
        </div>
      </main>
    </div>
  );
}

export default VagasSalvas;
