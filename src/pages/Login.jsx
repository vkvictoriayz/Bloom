import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { entrarUsuaria, salvarSessao } from "../services/auth";
import { destinoAposLogin } from "../services/destino";
import TelaAcesso, { LinkAcesso } from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";
import Botao from "../components/ui/Botao";
import { Aviso, Campo, Entrada } from "../components/ui/Campo";

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
      navigate(destinoAposLogin(sessao));
    } catch (erro) {
      setMensagem(erro.message);
      setTipoMensagem("erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAcesso
      etiqueta="Bem-vinda de volta"
      titulo="Entre na sua conta"
      subtitulo="Florescer é voltar para você."
      aoEnviar={entrar}
      rodape={
        <>
          <p>
            Ainda não tem conta? <LinkAcesso to="/cadastro">Cadastre-se</LinkAcesso>
          </p>
          <p>
            <Link to="/empresa/login" className="text-suave underline-offset-4 hover:text-tinta hover:underline">
              Sou uma empresa
            </Link>
          </p>
        </>
      }
    >
      <Campo rotulo="E-mail">
        {(props) => (
          <Entrada
            {...props}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Campo>

      <CampoSenha
        rotulo="Senha"
        valor={senha}
        aoMudar={setSenha}
        placeholder="Sua senha"
        acessorio={
          <Link className="text-xs font-semibold text-vinho underline-offset-4 hover:underline" to="/recuperar-senha">
            Esqueci minha senha
          </Link>
        }
      />

      {mensagem && <Aviso tipo={tipoMensagem}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </Botao>
    </TelaAcesso>
  );
}

export default Login;
