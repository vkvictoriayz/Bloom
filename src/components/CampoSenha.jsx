import { useState } from "react";
import Icone from "./Icone";

// Campo de senha com o botão de mostrar/ocultar.
function CampoSenha({ rotulo, valor, aoMudar, placeholder, autoComplete = "current-password" }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <label className="campo">
      <span className="campo-rotulo">{rotulo}</span>

      <span className="senha-container">
        <input
          type={mostrar ? "text" : "password"}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className="mostrar-senha"
          onClick={() => setMostrar(!mostrar)}
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          title={mostrar ? "Ocultar senha" : "Mostrar senha"}
        >
          <Icone nome={mostrar ? "olho-fechado" : "olho"} />
        </button>
      </span>
    </label>
  );
}

export default CampoSenha;
