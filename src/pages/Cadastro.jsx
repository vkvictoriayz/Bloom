import login from "../assets/login.png";
import { Link } from "react-router-dom";
import { useState } from "react";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  
  function cadastrar() {
    if (!nome || !email || !senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMensagem("Digite um e-mail válido!");
      setTipoMensagem("erro");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais!");
      setTipoMensagem("erro");
      return;
    }

    setMensagem("Cadastro preenchido corretamente!");
    setTipoMensagem("sucesso");
  }

  return (
    <div className="login">
      <div className="formulario">
        <div className="conteudo">
          <h1>Bloom</h1>

          <h2>Cadastro</h2>

          <h3>Crie sua conta</h3>

          <input
            type="text"
            placeholder="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="senha-container">
  <input
    type={mostrarSenha ? "text" : "password"}
    placeholder="senha"
    value={senha}
    onChange={(e) => setSenha(e.target.value)}
  />

  <button
    type="button"
    className="mostrar-senha"
    onClick={() => setMostrarSenha(!mostrarSenha)}
  >
    👁
  </button>
</div>

<div className="senha-container">
  <input
    type={mostrarConfirmarSenha ? "text" : "password"}
    placeholder="confirme sua senha"
    value={confirmarSenha}
    onChange={(e) => setConfirmarSenha(e.target.value)}
  />

  <button
    type="button"
    className="mostrar-senha"
    onClick={() =>
      setMostrarConfirmarSenha(!mostrarConfirmarSenha)
    }
  >
    👁
  </button>
</div>
          <button onClick={cadastrar}>cadastrar</button>

          <Link to="/">Já tenho uma conta</Link>
        </div>
      </div>

      <div className="imagem">
        <img src={login} />
      </div>
    </div>
  );
}

export default Cadastro;