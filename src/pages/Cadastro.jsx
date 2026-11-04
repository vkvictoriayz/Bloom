import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cadastrarUsuaria, salvarSessao } from "../services/auth";
import { destinoAposLogin } from "../services/destino";
import { formatarCPF, formatarTelefone, validarCPF } from "../utils/documentos";
import TelaAcesso, { GrupoCampos, LinkAcesso } from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";
import imgAcesso from "../assets/ilustracoes/acesso-candidata.webp";
import Botao from "../components/ui/Botao";
import { Aviso, Campo, Entrada } from "../components/ui/Campo";

// Data de hoje (AAAA-MM-DD), limite do campo de nascimento.
const HOJE = new Date().toISOString().slice(0, 10);

function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  function falhar(texto) {
    setMensagem(texto);
    setTipoMensagem("erro");
  }

  // As mesmas regras são conferidas de novo no servidor.
  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !cpf || !nascimento || !senha || !confirmarSenha) {
      return falhar("Preencha todos os campos obrigatórios.");
    }
    if (!validarCPF(cpf)) return falhar("CPF inválido. Confira os números.");
    if (nascimento > HOJE) return falhar("Data de nascimento inválida.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return falhar("Digite um e-mail válido.");
    if (senha.length < 8) return falhar("A senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmarSenha) return falhar("As senhas não são iguais.");

    setCarregando(true);
    setMensagem("");

    try {
      const sessao = await cadastrarUsuaria({
        nome: nome.trim(),
        email: email.trim(),
        cpf,
        nascimento,
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
        imagem: imgAcesso,
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

        <Campo rotulo="Data de nascimento">
          {(props) => (
            <Entrada
              {...props}
              type="date"
              autoComplete="bday"
              max={HOJE}
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
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
      <p className="-mt-2 text-xs leading-relaxed text-suave">
        O CPF e a data de nascimento servem só para confirmar sua identidade. Eles não aparecem no seu perfil.
      </p>
      </GrupoCampos>

      <GrupoCampos indice="2" titulo="Segurança">
      <CampoSenha
        rotulo="Senha"
        valor={senha}
        aoMudar={setSenha}
        placeholder="Mínimo de 8 caracteres"
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
