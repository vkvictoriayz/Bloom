import { useNavigate } from "react-router-dom";
import MenuLateral from "../components/MenuLateral";
import { useState } from "react";

function Home() {
  const [busca, setBusca] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const navigate = useNavigate();

  function pesquisar() {
  if (!busca.trim()) {
    alert("Digite algo para pesquisar.");
    return;
  }

  navigate("/vagas");
}
  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="inicio" />

      <main className="perfil-conteudo">
        <div className="perfil-titulo">
          <h2>Olá! 👋</h2>
          <p>Encontre oportunidades que combinam com você.</p>
        </div>

        <section className="perfil-card busca-home">
          <h3>🔎 Encontre sua próxima oportunidade</h3>

          <div className="busca-container">
            <input
              type="text"
              placeholder="Cargo, área ou palavra-chave"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <button onClick={pesquisar}>
              Buscar
            </button>

            <button
              className="botao-filtro"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              ⚙ Filtros
            </button>
          </div>

          {mostrarFiltros && (
            <div className="filtros">
              <div>
                <label>Localização</label>

                <select>
                  <option value="">Todas</option>
                  <option>São Paulo</option>
                  <option>Rio de Janeiro</option>
                  <option>Curitiba</option>
                  <option>Remoto</option>
                </select>
              </div>

              <div>
                <label>Modalidade</label>

                <select>
                  <option value="">Todas</option>
                  <option>Presencial</option>
                  <option>Híbrido</option>
                  <option>Remoto</option>
                </select>
              </div>

              <div>
                <label>Tipo de contrato</label>

                <select>
                  <option value="">Todos</option>
                  <option>CLT</option>
                  <option>Estágio</option>
                  <option>Jovem Aprendiz</option>
                  <option>Temporário</option>
                </select>
              </div>

              <div>
                <label>Área</label>

                <select>
                  <option value="">Todas</option>
                  <option>Tecnologia</option>
                  <option>Administração</option>
                  <option>Marketing</option>
                  <option>Design</option>
                </select>
              </div>
            </div>
          )}
        </section>

        <section className="perfil-card">
          <h3>💼 Vagas recomendadas</h3>

          <p>
            Em breve você verá aqui vagas recomendadas para o seu
            perfil.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Home;