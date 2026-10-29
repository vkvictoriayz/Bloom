import MenuLateral from "../components/MenuLateral";
import { obterSessao } from "../services/auth";

const ITENS_EMPRESA = [
  { id: "inicio", rotulo: "Início", rota: "/empresa/painel", icone: "inicio" },
];

// Página provisória: a área da empresa (publicar vagas etc.) ainda não existe.
function PainelEmpresa() {
  const sessao = obterSessao();

  return (
    <div className="perfil-pagina">
      <MenuLateral ativo="inicio" itens={ITENS_EMPRESA} rotaSair="/empresa" />

      <main className="perfil-conteudo">
        <header className="perfil-titulo">
          <h2>Olá, {sessao?.usuario.nome}</h2>
          <p className="subtitulo">Que bom ter você por aqui.</p>
        </header>

        <section className="perfil-card estado-vazio">
          <h3>Suas vagas</h3>
          <p>
            Em breve você poderá publicar vagas e acompanhar as candidaturas
            por aqui.
          </p>
        </section>
      </main>
    </div>
  );
}

export default PainelEmpresa;
