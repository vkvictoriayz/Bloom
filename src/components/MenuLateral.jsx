import { Link } from "react-router-dom";
import { sair } from "../services/auth";

const ITENS = [
  { id: "inicio", rotulo: "Início", rota: "/home" },
  { id: "perfil", rotulo: "Meu Perfil", rota: "/perfil" },
  { id: "candidaturas", rotulo: "Minhas candidaturas", rota: "/minhas-candidaturas" },
  { id: "salvas", rotulo: "Vagas salvas", rota: "/vagas-salvas" },
];

// "ativo" é o id do item da página atual.
function MenuLateral({ ativo }) {
  return (
    <aside className="perfil-menu">
      <h1>Bloom</h1>

      <nav>
        {ITENS.map((item) => (
          <Link
            key={item.id}
            to={item.rota}
            className={item.id === ativo ? "menu-ativo" : undefined}
          >
            {item.rotulo}
          </Link>
        ))}

        <Link to="/" onClick={sair}>
          Sair
        </Link>
      </nav>
    </aside>
  );
}

export default MenuLateral;
