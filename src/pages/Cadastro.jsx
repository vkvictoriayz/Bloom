import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cadastrarUsuaria, salvarSessao } from "../services/auth";
import { formatarCPF, formatarTelefone } from "../utils/documentos";
import TelaAcesso from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  
  async function cadastrar() {
    if (!nome || !email || !cpf || !senha || !confirmarSenha) {
      setMensagem("Preencha todos os campos!");
      setTipoMensagem("erro");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMensagem("Digite um e-mail válido!");
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
      const sessao = await cadastrarUsuaria({
        nome,
        email,
        cpf,
        telefone,
        senha,
        confirmarSenha,
      });
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
      titulo="Crie sua conta"
      subtitulo="Seu próximo capítulo começa aqui."
      aoEnviar={cadastrar}
      rodape={
        <>
          <p>
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
          <p>
            <Link to="/empresa/cadastro" className="link-discreto">Sou uma empresa</Link>
          </p>
        </>
      }
    >
      <label className="campo">
        <span className="campo-rotulo">Nome completo</span>
        <input
          type="text"
          placeholder="Como você se chama"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>

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

      <div className="campos-linha">
        <label className="campo">
          <span className="campo-rotulo">CPF</span>
          <input
            type="text"
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
          />
        </label>

        <label className="campo">
          <span className="campo-rotulo">
            Telefone <span className="campo-opcional">(opcional)</span>
          </span>
          <input
            type="text"
            placeholder="(00) 00000-0000"
            inputMode="tel"
            autoComplete="tel"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
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
        {carregando ? "Criando conta..." : "Criar conta"}
      </button>
    </TelaAcesso>
  );
}

export default Cadastro;
