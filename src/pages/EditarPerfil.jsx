import { Link } from "react-router-dom";
import { useState } from "react";

function EditarPerfil() {
  const dadosSalvos = localStorage.getItem("perfil");

  const dadosIniciais = dadosSalvos
    ? JSON.parse(dadosSalvos)
    : {
        nome: "",
        email: "",
        telefone: "",
        localizacao: "",
        sobreMim: "",
        objetivo: "",
        curso: "",
        instituicao: "",
        nivel: "",
        cargo: "",
        empresa: "",
        descricaoExperiencia: "",
        competencias: "",
      };

  const [nome, setNome] = useState(dadosIniciais.nome);
  const [email, setEmail] = useState(dadosIniciais.email);
  const [telefone, setTelefone] = useState(dadosIniciais.telefone);
  const [localizacao, setLocalizacao] = useState(dadosIniciais.localizacao);
  const [sobreMim, setSobreMim] = useState(dadosIniciais.sobreMim);
  const [objetivo, setObjetivo] = useState(dadosIniciais.objetivo);

  const [curso, setCurso] = useState(dadosIniciais.curso);
  const [instituicao, setInstituicao] = useState(dadosIniciais.instituicao);
  const [nivel, setNivel] = useState(dadosIniciais.nivel);

  const [cargo, setCargo] = useState(dadosIniciais.cargo);
  const [empresa, setEmpresa] = useState(dadosIniciais.empresa);
  const [descricaoExperiencia, setDescricaoExperiencia] = useState(
    dadosIniciais.descricaoExperiencia
  );

  const [competencias, setCompetencias] = useState(
    dadosIniciais.competencias
  );

  const [mensagem, setMensagem] = useState("");

  function salvarAlteracoes() {
    const dadosPerfil = {
      nome,
      email,
      telefone,
      localizacao,
      sobreMim,
      objetivo,
      curso,
      instituicao,
      nivel,
      cargo,
      empresa,
      descricaoExperiencia,
      competencias,
    };

    localStorage.setItem(
      "perfil",
      JSON.stringify(dadosPerfil)
    );

    setMensagem("Alterações salvas com sucesso!");
  }

  return (
    <div className="perfil-pagina">
      <aside className="perfil-menu">
        <h1>Bloom</h1>

        <nav>
          <Link to="/perfil">Meu Perfil</Link>

          <Link to="#">
            Minhas candidaturas
          </Link>

          <Link to="#">
            Competências
          </Link>

          <Link to="#">
            Currículo
          </Link>

          <Link to="#">
            Vagas salvas
          </Link>
        </nav>
      </aside>

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Editar perfil</h2>
        </div>

        <section className="perfil-card">
          <h3>Informações pessoais</h3>

          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <input
            type="text"
            placeholder="Localização"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
          />

          <h3>Sobre mim</h3>

          <textarea
            placeholder="Conte um pouco sobre você..."
            value={sobreMim}
            onChange={(e) => setSobreMim(e.target.value)}
          />

          <h3>Objetivo de carreira</h3>

          <textarea
            placeholder="Conte seus objetivos profissionais..."
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          />

          <h3>Formação acadêmica</h3>

          <input
            type="text"
            placeholder="Curso"
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
          />

          <input
            type="text"
            placeholder="Instituição"
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nível da formação"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          />

          <h3>Experiência profissional</h3>

          <input
            type="text"
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nome da empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />

          <textarea
            placeholder="Descrição da experiência"
            value={descricaoExperiencia}
            onChange={(e) =>
              setDescricaoExperiencia(e.target.value)
            }
          />

          <h3>Competências</h3>

          <input
            type="text"
            placeholder="Ex: JavaScript, React, HTML, CSS"
            value={competencias}
            onChange={(e) => setCompetencias(e.target.value)}
          />

          <button
            className="botao-editar"
            onClick={salvarAlteracoes}
          >
            Salvar alterações
          </button>

          {mensagem && (
            <p className="mensagem sucesso">
              {mensagem}
            </p>
          )}

          <Link to="/perfil">
            Cancelar
          </Link>
        </section>
      </main>
    </div>
  );
}

export default EditarPerfil;