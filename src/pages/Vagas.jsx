import MenuLateral from "../components/MenuLateral";
import CartaoVaga from "../components/CartaoVaga";
import { useState } from "react";

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

  // Só visual por enquanto: marca quais cards foram salvos nesta tela.
  const [salvas, setSalvas] = useState([]);

  function alternarSalva(index) {
    setSalvas((atuais) =>
      atuais.includes(index) ? atuais.filter((i) => i !== index) : [...atuais, index]
    );
  }

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="inicio" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Vagas</h2>
          <p className="subtitulo">Encontre oportunidades que combinam com você.</p>
        </header>

        <p className="lista-contagem">
          {vagas.length} {vagas.length === 1 ? "vaga encontrada" : "vagas encontradas"}
        </p>

        <div className="lista-vagas">
          {vagas.map((vaga, index) => (
            <CartaoVaga
              key={index}
              vaga={vaga}
              salva={salvas.includes(index)}
              aoSalvar={() => alternarSalva(index)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Vagas;
