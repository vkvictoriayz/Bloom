import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { entrarEmpresa, salvarSessao } from "../services/auth";
import TelaAcesso from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";

function LoginEmpresa() {
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
      const sessao = await entrarEmpresa({ email, senha });
      salvarSessao(sessao);
      navigate("/empresa/painel");
    } catch (erro) {
      setMensagem(erro.message);
      setTipoMensagem("erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAcesso
      titulo="Área da empresa"
      subtitulo="Publique vagas e conheça talentos."
      aoEnviar={entrar}
      rodape={
        <>
          <p>
            Ainda não cadastrou? <Link to="/empresa/cadastro">Cadastre sua empresa</Link>
          </p>
          <p>
            <Link to="/" className="link-discreto">Sou uma usuária</Link>
          </p>
        </>
      }
    >
      <label className="campo">
        <span className="campo-rotulo">E-mail corporativo</span>
        <input
          type="email"
          placeholder="contato@empresa.com"
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

export default LoginEmpresa;
