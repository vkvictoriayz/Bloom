import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { entrarUsuaria, salvarSessao } from "../services/auth";
import TelaAcesso from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
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
      navigate("/");
    } catch (erro) {
      setMensagem(erro.message);
      setTipoMensagem("erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAcesso
      titulo="Entre na sua conta"
      subtitulo="Florescer é voltar para você."
      aoEnviar={entrar}
      rodape={
        <>
          <p>
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
          <p>
            <Link to="/empresa/login" className="link-discreto">Sou uma empresa</Link>
          </p>
        </>
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

      <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} placeholder="Sua senha" />

      <Link className="esqueci" to="/recuperar-senha">
        Esqueci minha senha
      </Link>

      {mensagem && (
        <p className={`mensagem ${tipoMensagem}`} role="alert">
          {mensagem}
        </p>
      )}

      <button type="submit" className="botao" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </TelaAcesso>
  );
}

export default Login;
