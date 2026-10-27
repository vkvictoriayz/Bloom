import login from "../assets/login.png";
import { Link } from "react-router-dom";
import { useState } from "react";

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
    <div className="login">
      <div className="formulario">
        <div className="conteudo">
          <h1>Bloom</h1>

          <h2>Recuperar senha</h2>

          <h3>
            Digite seu e-mail para receber as instruções
          </h3>

          <input
            type="text"
            placeholder="e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mensagem && (
            <p className={`mensagem ${tipoMensagem}`}>
              {mensagem}
            </p>
          )}

          <button onClick={recuperarSenha}>
            enviar
          </button>

          <Link to="/">Voltar para o login</Link>
        </div>
      </div>

      <div className="imagem">
        <img src={login} />
      </div>
    </div>
  );
}

export default RecuperarSenha;