import { Link } from "react-router-dom";
import { sair } from "../services/auth";
import Logo from "./Logo";
import Icone from "./Icone";

const ITENS = [
  { id: "inicio", rotulo: "Início", rota: "/home", icone: "inicio" },
  { id: "perfil", rotulo: "Meu perfil", rota: "/perfil", icone: "perfil" },
  { id: "candidaturas", rotulo: "Minhas candidaturas", rota: "/minhas-candidaturas", icone: "candidaturas" },
  { id: "salvas", rotulo: "Vagas salvas", rota: "/vagas-salvas", icone: "coracao" },
];

// "ativo" é o id do item da página atual.
// "itens" e "rotaSair" permitem reaproveitar o menu na área da empresa.
function MenuLateral({ ativo, itens = ITENS, rotaSair = "/" }) {
  return (
    <aside className="perfil-menu">
      <Link to={itens[0].rota} className="perfil-menu-logo" aria-label="Bloom, ir para o início">
        <Logo variante="clara" />
      </Link>

      <nav aria-label="Menu principal">
        {itens.map((item) => (
          <Link
            key={item.id}
            to={item.rota}
            className={item.id === ativo ? "menu-ativo" : undefined}
            aria-current={item.id === ativo ? "page" : undefined}
          >
            <Icone nome={item.icone} />
            <span>{item.rotulo}</span>
          </Link>
        ))}
      </nav>

      <Link to={rotaSair} onClick={sair} className="perfil-menu-sair">
        <Icone nome="sair" />
        <span>Sair</span>
      </Link>
    </aside>
  );
}

export default MenuLateral;
