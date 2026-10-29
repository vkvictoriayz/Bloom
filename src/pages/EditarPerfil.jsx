import { Link } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
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
      <MenuLateral ativo="perfil" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Editar perfil</h2>
          <p className="subtitulo">Mantenha suas informações sempre atualizadas.</p>
        </header>

        <section className="perfil-card formulario-perfil">
          <h3>Informações pessoais</h3>
          <div className="campos-grade">
            <label className="campo">
              <span className="campo-rotulo">Nome completo</span>
              <input
                type="text"
                placeholder="Como você se chama"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">E-mail</span>
              <input
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">Telefone</span>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                autoComplete="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">Localização</span>
              <input
                type="text"
                placeholder="Cidade, estado"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="perfil-card formulario-perfil">
          <h3>Sobre você</h3>
          <label className="campo">
            <span className="campo-rotulo">Sobre mim</span>
            <textarea
              placeholder="Conte um pouco sobre você, sua trajetória e o que te move."
              value={sobreMim}
              onChange={(e) => setSobreMim(e.target.value)}
            />
          </label>
          <label className="campo">
            <span className="campo-rotulo">Objetivo de carreira</span>
            <textarea
              placeholder="Que tipo de oportunidade você procura?"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
            />
          </label>
        </section>

        <section className="perfil-card formulario-perfil">
          <h3>Formação acadêmica</h3>
          <div className="campos-grade">
            <label className="campo">
              <span className="campo-rotulo">Curso</span>
              <input
                type="text"
                placeholder="Ex: Desenvolvimento de Sistemas"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">Instituição</span>
              <input
                type="text"
                placeholder="Nome da instituição"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">Nível da formação</span>
              <input
                type="text"
                placeholder="Ex: Técnico, graduação"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="perfil-card formulario-perfil">
          <h3>Experiência profissional</h3>
          <div className="campos-grade">
            <label className="campo">
              <span className="campo-rotulo">Cargo</span>
              <input
                type="text"
                placeholder="Ex: Assistente administrativa"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="campo-rotulo">Empresa</span>
              <input
                type="text"
                placeholder="Nome da empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </label>
          </div>
          <label className="campo">
            <span className="campo-rotulo">Descrição da experiência</span>
            <textarea
              placeholder="Suas principais atividades e conquistas"
              value={descricaoExperiencia}
              onChange={(e) => setDescricaoExperiencia(e.target.value)}
            />
          </label>
        </section>

        <section className="perfil-card formulario-perfil">
          <h3>Competências</h3>
          <label className="campo">
            <span className="campo-rotulo">Separe cada competência por vírgula</span>
            <input
              type="text"
              placeholder="Ex: JavaScript, React, HTML, CSS"
              value={competencias}
              onChange={(e) => setCompetencias(e.target.value)}
            />
          </label>
        </section>

        <div className="formulario-acoes">
          <button type="button" className="botao-editar" onClick={salvarAlteracoes}>
            Salvar alterações
          </button>

          <Link to="/perfil" className="botao-secundario">
            Cancelar
          </Link>

          {mensagem && (
            <p className="mensagem sucesso" role="status">
              {mensagem}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default EditarPerfil;
