import { Link } from "react-router-dom";
import { useState } from "react";
import TelaAcesso from "../components/TelaAcesso";

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  function recuperarSenha() {
    if (!email) {
      setMensagem("Digite seu e-mail!");
      setTipoMensagem("erro");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMensagem("Digite um e-mail válido!");
      setTipoMensagem("erro");
      return;
    }

    setMensagem(
      "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."
    );
    setTipoMensagem("sucesso");
  }

  return (
    <TelaAcesso
      titulo="Recuperar senha"
      subtitulo="Enviaremos as instruções para o seu e-mail."
      aoEnviar={recuperarSenha}
      rodape={
        <p>
          Lembrou a senha? <Link to="/">Voltar para o login</Link>
        </p>
      }
    >
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

      {mensagem && (
        <p className={`mensagem ${tipoMensagem}`} role={tipoMensagem === "erro" ? "alert" : "status"}>
          {mensagem}
        </p>
      )}

      <button type="submit" className="botao">
        Enviar instruções
      </button>
    </TelaAcesso>
  );
}

export default RecuperarSenha;
