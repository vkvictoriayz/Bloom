import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { entrarUsuaria, salvarSessao } from "../services/auth";
import { destinoAposLogin } from "../services/destino";
import TelaAcesso, { LinkAcesso } from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";
import AcessoSocial from "../components/conta/AcessoSocial";
import LembrarESenha from "../components/conta/LembrarESenha";
import Icone from "../components/Icone";
import Botao from "../components/ui/Botao";
import { Aviso, Campo, Entrada } from "../components/ui/Campo";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar() {
    const novos = {};
    if (!email.trim()) novos.email = "Informe seu e-mail.";
    else if (!EMAIL.test(email.trim())) novos.email = "Digite um e-mail válido.";
    if (!senha) novos.senha = "Informe sua senha.";
    setErros(novos);
    setMensagem("");
    if (Object.keys(novos).length) return;

    setCarregando(true);
    try {
      const sessao = await entrarUsuaria({ email: email.trim(), senha });
      salvarSessao(sessao, { lembrar });
      navigate(destinoAposLogin(sessao));
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAcesso
      titulo="Entre na sua conta"
      ocultarTitulo
      aoEnviar={entrar}
      rodape={
        <>
          <p>
            Não tem uma conta? <LinkAcesso to="/cadastro">Criar conta</LinkAcesso>
          </p>
          <p>
            <Link to="/empresa/login" className="text-suave underline-offset-4 hover:text-tinta hover:underline">
              Sou uma empresa
            </Link>
          </p>
        </>
      }
    >
      <AcessoSocial tipo="usuaria" />

      <Campo rotulo="E-mail" rotuloOculto erro={erros.email}>
        {(props) => (
          <div className="relative">
            <Icone nome="email" tamanho={17} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-suave" />
            <Entrada
              {...props}
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11"
            />
          </div>
        )}
      </Campo>

      <CampoSenha rotulo="Senha" rotuloOculto icone="cadeado" valor={senha} aoMudar={setSenha} placeholder="Senha" erro={erros.senha} />

      <LembrarESenha lembrar={lembrar} aoMudar={setLembrar} />

      {mensagem && <Aviso tipo="erro">{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-1 w-full" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </Botao>
    </TelaAcesso>
  );
}

export default Login;
