import login from "../assets/login.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { entrarUsuaria, salvarSessao } from "../services/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar() {
    if (!email || !senha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMensagem("Digite um e-mail válido!");
      setTipoMensagem("erro");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const sessao = await entrarUsuaria({ email, senha });
      salvarSessao(sessao);
      navigate("/home");
    } catch (erro) {
      setMensagem(erro.message);
      setTipoMensagem("erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login">
      <div className="formulario">
        <div className="conteudo">
          <h1>Bloom</h1>

          <h2>Login</h2>

          <h3>Entre na sua conta</h3>

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

          <Link className="esqueci" to="/recuperar-senha">
  Esqueci minha senha
</Link>

          {mensagem && (
            <p className={`mensagem ${tipoMensagem}`}>
              {mensagem}
            </p>
          )}

          <button onClick={entrar} disabled={carregando}>
            {carregando ? "entrando..." : "entrar"}
          </button>

          <Link to="/cadastro">cadastre-se</Link>
          
          <Link to="/empresa">Sou uma empresa</Link>
        </div>
      </div>

      <div className="imagem">
        <img src={login} />
      </div>
    </div>
  );
}

export default Login;