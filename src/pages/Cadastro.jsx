import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cadastrarUsuaria, salvarSessao } from "../services/auth";
import { destinoAposLogin } from "../services/destino";
import { formatarCPF, formatarTelefone } from "../utils/documentos";
import TelaAcesso, { GrupoCampos, LinkAcesso } from "../components/TelaAcesso";
import { fotos } from "../data/imagens";
import CampoSenha from "../components/CampoSenha";
import Botao from "../components/ui/Botao";
import { Aviso, Campo, Entrada } from "../components/ui/Campo";

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
      etiqueta="Nova conta"
      titulo="Crie sua conta"
      subtitulo="Seu próximo capítulo começa aqui."
      visual={{
        foto: fotos.cadastro,
        frase: "Seu talento merece espaço para florescer.",
      }}
      aoEnviar={cadastrar}
      rodape={
        <>
          <p>
            Já tem uma conta? <LinkAcesso to="/login">Entrar</LinkAcesso>
          </p>
          <p>
            <Link to="/empresa/cadastro" className="text-suave underline-offset-4 hover:text-tinta hover:underline">
              Sou uma empresa
            </Link>
          </p>
        </>
      }
    >
      <GrupoCampos indice="1" titulo="Seus dados">
      <Campo rotulo="Nome completo">
        {(props) => (
          <Entrada
            {...props}
            type="text"
            placeholder="Como você se chama"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}
      </Campo>

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

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="CPF">
          {(props) => (
            <Entrada
              {...props}
              type="text"
              placeholder="000.000.000-00"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
            />
          )}
        </Campo>

        <Campo rotulo="Telefone" opcional>
          {(props) => (
            <Entrada
              {...props}
              type="text"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            />
          )}
        </Campo>
      </div>
      </GrupoCampos>

      <GrupoCampos indice="2" titulo="Segurança">
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
      </GrupoCampos>

      {mensagem && <Aviso tipo={tipoMensagem}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? "Criando conta..." : "Criar conta"}
      </Botao>
    </TelaAcesso>
  );
}

export default Cadastro;
