import { Link } from "react-router-dom";
import Icone from "./Icone";
import { separarLocalizacao } from "../utils/vagas";

// Quadradinho com a inicial da empresa (enquanto não há logo das empresas).
export function MonogramaEmpresa({ empresa = "", grande = false }) {
  return (
    <span className={`monograma ${grande ? "monograma-grande" : ""}`} aria-hidden="true">
      {empresa.trim().charAt(0).toUpperCase()}
    </span>
  );
}

// Card de vaga usado na lista de vagas e nas vagas salvas.
function CartaoVaga({ vaga, salva, aoSalvar }) {
  const { cidade, modalidade } = separarLocalizacao(vaga.localizacao);

  return (
    <article className="perfil-card vaga-card">
      <MonogramaEmpresa empresa={vaga.empresa} />

      <div className="vaga-info">
        <h3>
          <Link to="/vaga">{vaga.titulo}</Link>
        </h3>
        <p className="vaga-empresa">{vaga.empresa}</p>

        <ul className="vaga-meta">
          {cidade && (
            <li>
              <Icone nome="local" tamanho={16} />
              {cidade}
            </li>
          )}
          {vaga.salario && (
            <li>
              <Icone nome="salario" tamanho={16} />
              {vaga.salario}
            </li>
          )}
        </ul>

        <div className="etiquetas">
          {modalidade && <span>{modalidade}</span>}
          {vaga.area && <span>{vaga.area}</span>}
        </div>
      </div>

      <div className="vaga-acoes">
        <button
          type="button"
          className={`botao-salvar ${salva ? "ativo" : ""}`}
          onClick={aoSalvar}
          aria-pressed={salva}
          aria-label={salva ? "Remover dos salvos" : "Salvar vaga"}
          title={salva ? "Remover dos salvos" : "Salvar vaga"}
        >
          <Icone nome="coracao" preenchido={salva} />
        </button>

        <Link to="/vaga" className="botao-secundario">
          Ver vaga
        </Link>
      </div>
    </article>
  );
}

export default CartaoVaga;
