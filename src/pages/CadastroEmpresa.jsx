import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cadastrarEmpresa, salvarSessao } from "../services/auth";
import TelaAcesso from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";

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

    if (senha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres!");
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
    <TelaAcesso
      titulo="Cadastre sua empresa"
      subtitulo="Encontre mulheres prontas para crescer com você."
      aoEnviar={enviarCadastro}
      rodape={
        <p>
          Já tem uma conta? <Link to="/empresa">Entrar</Link>
        </p>
      }
    >
      <label className="campo">
        <span className="campo-rotulo">Nome da empresa</span>
        <input
          type="text"
          placeholder="Razão social ou nome fantasia"
          autoComplete="organization"
          value={nomeEmpresa}
          onChange={(e) => setNomeEmpresa(e.target.value)}
        />
      </label>

      <div className="campos-linha">
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

        <label className="campo">
          <span className="campo-rotulo">CNPJ</span>
          <input
            type="text"
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            value={cnpj}
            onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
          />
        </label>
      </div>

      <CampoSenha
        rotulo="Senha"
        valor={senha}
        aoMudar={setSenha}
        placeholder="Mínimo de 6 caracteres"
        autoComplete="new-password"
      />

      <CampoSenha
        rotulo="Confirme sua senha"
        valor={confirmarSenha}
        aoMudar={setConfirmarSenha}
        placeholder="Digite a senha novamente"
        autoComplete="new-password"
      />

      {mensagem && (
        <p className={`mensagem ${tipoMensagem}`} role="alert">
          {mensagem}
        </p>
      )}

      <button type="submit" className="botao" disabled={carregando}>
        {carregando ? "Cadastrando..." : "Cadastrar empresa"}
      </button>
    </TelaAcesso>
  );
}

export default CadastroEmpresa;
