import { Link } from "react-router-dom";
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

  return (
    <div className="perfil-pagina">
      <aside className="perfil-menu">
        <h1>Bloom</h1>

        <nav>
          <Link to="/perfil" className="menu-ativo">
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
          <h2>Perfil</h2>
        </div>

        <section className="perfil-card perfil-principal">
          <div className="foto-perfil">
            {foto ? (
              <img
                src={foto}
                alt="Foto de perfil"
              />
            ) : (
              <span>👤</span>
            )}
          </div>

          <div className="dados-principais">
            <h3>{dadosPerfil.nome}</h3>

            <p>📍 {dadosPerfil.localizacao}</p>
            <p>✉️ {dadosPerfil.email}</p>
            <p>📞 {dadosPerfil.telefone}</p>
          </div>

          <div>
            <label className="botao-editar">
              Alterar foto

              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={escolherFoto}
              />
            </label>

            <Link
              to="/editar-perfil"
              className="botao-editar"
            >
              Editar perfil
            </Link>
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
            <h3>🎓 Formação acadêmica</h3>

            <h4>{dadosPerfil.curso}</h4>

            <p>{dadosPerfil.instituicao}</p>

            <p>{dadosPerfil.nivel}</p>
          </section>

          <section className="perfil-card">
            <h3>💼 Experiência profissional</h3>

            <h4>{dadosPerfil.cargo}</h4>

            <p>{dadosPerfil.empresa}</p>

            <p>{dadosPerfil.descricaoExperiencia}</p>
          </section>
        </div>

        <section className="perfil-card">
          <h3>⚙️ Competências</h3>

          <div className="competencias">
            {dadosPerfil.competencias ? (
              dadosPerfil.competencias
                .split(",")
                .map((competencia, index) => (
                  <span key={index}>
                    {competencia.trim()}
                  </span>
                ))
            ) : (
              <p>Nenhuma competência adicionada.</p>
            )}
          </div>
        </section>

        <section className="perfil-card">
          <h3>📄 Currículo</h3>

          <div className="curriculo">
            <p>Nenhum currículo enviado.</p>

            <button className="botao-editar">
              Adicionar currículo
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Perfil;