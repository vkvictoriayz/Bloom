import { Link } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
import Icone from "../components/Icone";
import { useState } from "react";

function Perfil() {
  const dadosSalvos = localStorage.getItem("perfil");

  const dadosPerfil = dadosSalvos
    ? JSON.parse(dadosSalvos)
    : {
        nome: "Seu nome",
        email: "seuemail@email.com",
        telefone: "(00) 00000-0000",
        localizacao: "Sua localização",
        sobreMim:
          "Adicione uma descrição sobre você, sua experiência e seus objetivos.",
        objetivo:
          "Conte um pouco sobre seus objetivos profissionais e o que você busca no mercado de trabalho.",
        curso: "Seu curso",
        instituicao: "Nome da instituição",
        nivel: "Nível da formação",
        cargo: "Seu cargo",
        empresa: "Nome da empresa",
        descricaoExperiencia: "Descrição da experiência",
        competencias: "",
        foto: "",
      };

  const [foto, setFoto] = useState(dadosPerfil.foto || "");

  function escolherFoto(evento) {
    const arquivo = evento.target.files[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha uma imagem válida.");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const novaFoto = leitor.result;

      setFoto(novaFoto);

      const dadosAtualizados = {
        ...dadosPerfil,
        foto: novaFoto,
      };

      localStorage.setItem(
        "perfil",
        JSON.stringify(dadosAtualizados)
      );
    };

    leitor.readAsDataURL(arquivo);
  }

  const competencias = dadosPerfil.competencias
    ? dadosPerfil.competencias
        .split(",")
        .map((competencia) => competencia.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="perfil" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Meu perfil</h2>
          <p className="subtitulo">É assim que as empresas conhecem você.</p>
        </header>

        <section className="perfil-card perfil-principal">
          <div className="foto-perfil">
            {foto ? (
              <img src={foto} alt="Foto de perfil" />
            ) : (
              <Icone nome="perfil" tamanho={44} />
            )}
          </div>

          <div className="dados-principais">
            <h3>{dadosPerfil.nome}</h3>

            <ul className="vaga-meta">
              <li>
                <Icone nome="local" tamanho={16} />
                {dadosPerfil.localizacao}
              </li>
              <li>
                <Icone nome="email" tamanho={16} />
                {dadosPerfil.email}
              </li>
              <li>
                <Icone nome="telefone" tamanho={16} />
                {dadosPerfil.telefone}
              </li>
            </ul>
          </div>

          <div className="perfil-principal-acoes">
            <Link to="/editar-perfil" className="botao-editar">
              Editar perfil
            </Link>

            <label className="botao-secundario">
              <Icone nome="camera" tamanho={16} />
              Alterar foto
              <input
                type="file"
                accept="image/*"
                className="visualmente-oculto"
                onChange={escolherFoto}
              />
            </label>
          </div>
        </section>

        <section className="perfil-card">
          <h3>Sobre mim</h3>
          <p>{dadosPerfil.sobreMim}</p>
        </section>

        <section className="perfil-card">
          <h3>Objetivo de carreira</h3>
          <p>{dadosPerfil.objetivo}</p>
        </section>

        <div className="perfil-duplo">
          <section className="perfil-card">
            <h3>Formação acadêmica</h3>
            <h4>{dadosPerfil.curso}</h4>
            <p>{dadosPerfil.instituicao}</p>
            <p className="texto-secundario">{dadosPerfil.nivel}</p>
          </section>

          <section className="perfil-card">
            <h3>Experiência profissional</h3>
            <h4>{dadosPerfil.cargo}</h4>
            <p>{dadosPerfil.empresa}</p>
            <p className="texto-secundario">{dadosPerfil.descricaoExperiencia}</p>
          </section>
        </div>

        <section className="perfil-card">
          <h3>Competências</h3>

          <div className="competencias">
            {competencias.length > 0 ? (
              competencias.map((competencia, index) => (
                <span key={index}>{competencia}</span>
              ))
            ) : (
              <p>Nenhuma competência adicionada.</p>
            )}
          </div>
        </section>

        <section className="perfil-card">
          <h3>Currículo</h3>

          <div className="curriculo">
            <span className="curriculo-icone">
              <Icone nome="documento" />
            </span>
            <p>Nenhum currículo enviado.</p>

            <button type="button" className="botao-secundario">
              Adicionar currículo
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Perfil;
