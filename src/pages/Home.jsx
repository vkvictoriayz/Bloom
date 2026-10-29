import { Link, useNavigate } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
import Icone from "../components/Icone";
import { obterSessao } from "../services/auth";
import { useState } from "react";

function Home() {
  const [busca, setBusca] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [aviso, setAviso] = useState("");
  const navigate = useNavigate();

  const primeiroNome = obterSessao()?.usuario?.nome?.split(" ")[0];

  function pesquisar(evento) {
    evento.preventDefault();

    if (!busca.trim()) {
      setAviso("Digite um cargo, área ou palavra-chave para buscar.");
      return;
    }

    navigate("/vagas");
  }

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="inicio" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>{primeiroNome ? `Olá, ${primeiroNome}` : "Olá"}</h2>
          <p className="subtitulo">Encontre oportunidades que combinam com você.</p>
        </header>

        <section className="perfil-card busca-home">
          <h3>Encontre sua próxima oportunidade</h3>

          <form className="busca-container" onSubmit={pesquisar} role="search">
            <label className="busca-campo">
              <Icone nome="busca" />
              <input
                type="search"
                placeholder="Cargo, área ou palavra-chave"
                aria-label="Buscar vagas"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setAviso("");
                }}
              />
            </label>

            <button type="submit" className="botao">
              Buscar
            </button>

            <button
              type="button"
              className={`botao-secundario botao-filtro ${mostrarFiltros ? "ativo" : ""}`}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              aria-expanded={mostrarFiltros}
              aria-controls="filtros-busca"
            >
              <Icone nome="filtros" />
              Filtros
            </button>
          </form>

          {aviso && <p className="aviso-busca">{aviso}</p>}

          {mostrarFiltros && (
            <div className="filtros" id="filtros-busca">
              <label>
                <span>Localização</span>
                <select>
                  <option value="">Todas</option>
                  <option>São Paulo</option>
                  <option>Rio de Janeiro</option>
                  <option>Curitiba</option>
                  <option>Remoto</option>
                </select>
              </label>

              <label>
                <span>Modalidade</span>
                <select>
                  <option value="">Todas</option>
                  <option>Presencial</option>
                  <option>Híbrido</option>
                  <option>Remoto</option>
                </select>
              </label>

              <label>
                <span>Tipo de contrato</span>
                <select>
                  <option value="">Todos</option>
                  <option>CLT</option>
                  <option>Estágio</option>
                  <option>Jovem Aprendiz</option>
                  <option>Temporário</option>
                </select>
              </label>

              <label>
                <span>Área</span>
                <select>
                  <option value="">Todas</option>
                  <option>Tecnologia</option>
                  <option>Administração</option>
                  <option>Marketing</option>
                  <option>Design</option>
                </select>
              </label>
            </div>
          )}
        </section>

        <section className="perfil-card estado-vazio">
          <h3>Vagas recomendadas</h3>
          <p>
            Complete seu perfil para receber aqui vagas escolhidas para você.
            Enquanto isso, veja as oportunidades abertas.
          </p>
          <div className="estado-vazio-acoes">
            <Link to="/vagas" className="botao-secundario">
              Ver todas as vagas
            </Link>
            <Link to="/editar-perfil" className="link-discreto">
              Completar perfil
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
