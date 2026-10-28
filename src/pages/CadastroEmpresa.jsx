import login from "../assets/login.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cadastrarEmpresa, salvarSessao } from "../services/auth";

function CadastroEmpresa() {
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  function formatarCNPJ(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 14);

    let formatado = numeros;

    if (numeros.length > 2) {
      formatado =
        numeros.slice(0, 2) + "." + numeros.slice(2);
    }

    if (numeros.length > 5) {
      formatado =
        numeros.slice(0, 2) +
        "." +
        numeros.slice(2, 5) +
        "." +
        numeros.slice(5);
    }

    if (numeros.length > 8) {
      formatado =
        numeros.slice(0, 2) +
        "." +
        numeros.slice(2, 5) +
        "." +
        numeros.slice(5, 8) +
        "/" +
        numeros.slice(8);
    }

    if (numeros.length > 12) {
      formatado =
        numeros.slice(0, 2) +
        "." +
        numeros.slice(2, 5) +
        "." +
        numeros.slice(5, 8) +
        "/" +
        numeros.slice(8, 12) +
        "-" +
        numeros.slice(12, 14);
    }

    return formatado;
  }

  async function enviarCadastro() {
    if (!nomeEmpresa || !email || !cnpj || !senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMensagem("Digite um e-mail válido!");
      setTipoMensagem("erro");
      return;
    }

    const numerosCNPJ = cnpj.replace(/\D/g, "");

    if (numerosCNPJ.length !== 14) {
      setMensagem("Digite um CNPJ válido!");
      setTipoMensagem("erro");
      return;
    }

    if (senha.length < 8) {
      setMensagem("A senha deve ter pelo menos 8 caracteres!");
      setTipoMensagem("erro");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais!");
      setTipoMensagem("erro");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const sessao = await cadastrarEmpresa({
        nome: nomeEmpresa,
        email,
        cnpj,
        senha,
        confirmarSenha,
      });
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
    <div className="login">
      <div className="formulario">
        <div className="conteudo">
          <h1>Bloom</h1>

          <h2>Cadastro Empresa</h2>

          <h3>Cadastre sua empresa</h3>

          <input
            type="text"
            placeholder="nome da empresa"
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
          />

          <input
            type="text"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
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
              👁️
            </button>
          </div>

          {mensagem && (
            <p className={`mensagem ${tipoMensagem}`}>
              {mensagem}
            </p>
          )}

          <button onClick={enviarCadastro} disabled={carregando}>
            {carregando ? "cadastrando..." : "cadastrar"}
          </button>

          <Link to="/empresa">Já tenho uma conta</Link>
        </div>
      </div>

      <div className="imagem">
        <img src={login} />
      </div>
    </div>
  );
}

export default CadastroEmpresa;