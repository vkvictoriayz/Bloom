import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cadastrarUsuaria, salvarSessao } from "../services/auth";
import { destinoAposLogin } from "../services/destino";
import { formatarCPF, formatarTelefone, somenteDigitos, validarCPF } from "../utils/documentos";
import { problemaSenha } from "../utils/senha";
import TelaAcesso, { GrupoCampos, LinkAcesso } from "../components/TelaAcesso";
import CampoSenha from "../components/CampoSenha";
import AcessoSocial from "../components/conta/AcessoSocial";
import { lerPreCadastro, limparFragmento } from "../utils/oauth";
import Consentimentos from "../components/conta/Consentimentos";
import RequisitosSenha from "../components/conta/RequisitosSenha";
import Icone from "../components/Icone";
import Botao from "../components/ui/Botao";
import { Aviso, Campo, Entrada } from "../components/ui/Campo";
import { cn } from "../lib/cn";

const HOJE = new Date().toISOString().slice(0, 10);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IDENTIDADES = [
  { valor: "mulher_cis", rotulo: "Mulher cisgênero" },
  { valor: "mulher_trans", rotulo: "Mulher transgênero" },
  { valor: "nao_informar", rotulo: "Prefiro não informar" },
];

const INICIAL = {
  nomeCivil: "",
  nomeSocial: "",
  email: "",
  telefone: "",
  cpf: "",
  nascimento: "",
  identidadeGenero: "",
  senha: "",
  confirmarSenha: "",
  aceiteTermos: false,
  cienciaDados: false,
  comunicacoes: false,
};

function validar(d, social) {
  const e = {};
  if (d.nomeCivil.trim().length < 2) e.nomeCivil = "Informe seu nome civil completo, como no documento.";
  if (d.nomeSocial.trim() && d.nomeSocial.trim().length < 2) e.nomeSocial = "O nome social deve ter pelo menos 2 letras.";
  if (!d.email.trim()) e.email = "Informe seu e-mail.";
  else if (!EMAIL.test(d.email.trim())) e.email = "Digite um e-mail válido.";
  const tel = somenteDigitos(d.telefone);
  if (!tel) e.telefone = "Informe seu telefone.";
  else if (tel.length < 10) e.telefone = "Use DDD + número.";
  if (!d.cpf) e.cpf = "Informe seu CPF.";
  else if (!validarCPF(d.cpf)) e.cpf = "CPF inválido. Confira os números.";
  if (!d.nascimento) e.nascimento = "Informe sua data de nascimento.";
  else if (d.nascimento > HOJE) e.nascimento = "Data de nascimento inválida.";
  if (!d.identidadeGenero) e.identidadeGenero = "Escolha uma opção (você pode escolher não informar).";
  if (!social) {
    const senha = problemaSenha(d.senha);
    if (senha) e.senha = senha;
    if (!d.confirmarSenha) e.confirmarSenha = "Confirme a senha.";
    else if (d.senha !== d.confirmarSenha) e.confirmarSenha = "As senhas não são iguais.";
  }
  if (!d.aceiteTermos) e.aceiteTermos = "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.";
  if (!d.cienciaDados) e.cienciaDados = "Confirme que está ciente do tratamento dos seus dados.";
  return e;
}

function Cadastro() {
  // Vindo do Google/GitHub: nome e e-mail já chegam preenchidos e não é preciso criar senha.
  const [social] = useState(lerPreCadastro);
  const [dados, setDados] = useState(() => (social ? { ...INICIAL, nomeCivil: social.nome, email: social.email } : INICIAL));
  useEffect(() => {
    if (social) limparFragmento();
  }, [social]);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function cadastrar() {
    const novos = validar(dados, social);
    setErros(novos);
    setMensagem("");
    if (Object.keys(novos).length) {
      setMensagem("Confira os campos destacados.");
      return;
    }

    setCarregando(true);
    try {
      const sessao = await cadastrarUsuaria({
        ...dados,
        nomeCivil: dados.nomeCivil.trim(),
        nomeSocial: dados.nomeSocial.trim(),
        email: dados.email.trim(),
        ...(social ? { oauth: social.token, senha: undefined, confirmarSenha: undefined } : {}),
      });
      salvarSessao(sessao);
      navigate("/cadastro/concluido", {
        replace: true,
        state: { tipo: "usuaria", nome: sessao.usuario.nome, email: sessao.usuario.email, emailEnviado: sessao.verificacao?.emailEnviado, emailVerificado: sessao.usuario.emailVerificado, destino: destinoAposLogin(sessao) },
      });
    } catch (erro) {
      if (erro.campo) setErros((e) => ({ ...e, [erro.campo]: erro.message }));
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAcesso
      etiqueta="Nova conta"
      titulo="Crie sua conta"
      subtitulo="Seu próximo capítulo começa aqui. Leva poucos minutos."
      visual={{ frase: "Seu talento merece espaço para florescer.", itens: ["Senhas guardadas com criptografia", "Identidade de gênero nunca aparece no perfil", "Você controla o que fica público"] }}
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
      {social ? (
        <Aviso tipo="info">
          Você está criando a conta com o {social.provedor} ({social.email}). Complete os dados abaixo. Não é preciso criar senha.
        </Aviso>
      ) : (
        <AcessoSocial tipo="usuaria" acao="cadastrar" textoDivisor="ou preencha seus dados" />
      )}

      <p className="-mt-1 text-xs text-suave">
        Campos com <span className="text-rosa">*</span> são obrigatórios.
      </p>

      <GrupoCampos indice="1" titulo="Informações pessoais">
        <Campo rotulo="Nome civil completo" obrigatorio erro={erros.nomeCivil} ajuda="Como está no seu documento. Serve só para identificação e não aparece no seu perfil.">
          {(props) => (
            <Entrada {...props} type="text" autoComplete="name" maxLength={100} value={dados.nomeCivil} onChange={(e) => mudar("nomeCivil", e.target.value)} />
          )}
        </Campo>

        <Campo rotulo="Nome social" opcional erro={erros.nomeSocial} ajuda="Se preencher, é este o nome que aparece no seu perfil e nas conversas.">
          {(props) => (
            <Entrada {...props} type="text" autoComplete="nickname" maxLength={100} value={dados.nomeSocial} onChange={(e) => mudar("nomeSocial", e.target.value)} />
          )}
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="E-mail" obrigatorio erro={erros.email} ajuda={social ? `Confirmado pelo ${social.provedor}.` : undefined}>
            {(props) => (
              <Entrada
                {...props}
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
                value={dados.email}
                readOnly={Boolean(social)}
                onChange={(e) => mudar("email", e.target.value)}
              />
            )}
          </Campo>
          <Campo rotulo="Telefone" obrigatorio erro={erros.telefone}>
            {(props) => (
              <Entrada
                {...props}
                type="text"
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
                value={dados.telefone}
                onChange={(e) => mudar("telefone", formatarTelefone(e.target.value))}
              />
            )}
          </Campo>
          <Campo rotulo="CPF" obrigatorio erro={erros.cpf}>
            {(props) => (
              <Entrada {...props} type="text" placeholder="000.000.000-00" inputMode="numeric" value={dados.cpf} onChange={(e) => mudar("cpf", formatarCPF(e.target.value))} />
            )}
          </Campo>
          <Campo rotulo="Data de nascimento" obrigatorio erro={erros.nascimento}>
            {(props) => (
              <Entrada {...props} type="date" autoComplete="bday" max={HOJE} value={dados.nascimento} onChange={(e) => mudar("nascimento", e.target.value)} />
            )}
          </Campo>
        </div>
        <p className="-mt-2 flex items-start gap-2 text-xs leading-relaxed text-suave">
          <Icone nome="cadeado" tamanho={14} className="mt-px shrink-0 text-rosa" />
          CPF e data de nascimento servem só para confirmar sua identidade. Não aparecem no perfil nem são mostrados a empresas.
        </p>
      </GrupoCampos>

      <GrupoCampos indice="2" titulo="Informações adicionais">
        <fieldset aria-describedby="ajuda-identidade" aria-invalid={erros.identidadeGenero ? true : undefined}>
          <legend className="mb-2 text-sm font-semibold text-tinta-2">
            Identidade de gênero <span className="text-rosa" aria-hidden="true">*</span>
            <span className="sr-only"> (obrigatório)</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {IDENTIDADES.map((op) => {
              const marcado = dados.identidadeGenero === op.valor;
              return (
                <label
                  key={op.valor}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors duration-300 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-rosa/20",
                    marcado ? "border-rosa bg-blush/50 font-semibold text-vinho-escuro" : "border-rosa/20 bg-white/80 text-tinta-2 hover:border-rosa/40"
                  )}
                >
                  <input
                    type="radio"
                    name="identidadeGenero"
                    value={op.valor}
                    checked={marcado}
                    onChange={() => mudar("identidadeGenero", op.valor)}
                    className="size-4 shrink-0 accent-[#9c4a63]"
                  />
                  {op.rotulo}
                </label>
              );
            })}
          </div>
          <p id="ajuda-identidade" className={cn("mt-2 flex items-start gap-2 text-xs leading-relaxed", erros.identidadeGenero ? "text-erro" : "text-suave")}>
            {erros.identidadeGenero ? (
              erros.identidadeGenero
            ) : (
              <>
                <Icone nome="cadeado" tamanho={14} className="mt-px shrink-0 text-rosa" />
                Informação privada: não aparece no seu perfil e não é compartilhada com empresas. Você pode mudar nas configurações.
              </>
            )}
          </p>
        </fieldset>
      </GrupoCampos>

      {!social && (
      <GrupoCampos indice="3" titulo="Segurança">
        <CampoSenha
          rotulo="Senha"
          obrigatorio
          valor={dados.senha}
          aoMudar={(v) => mudar("senha", v)}
          autoComplete="new-password"
          erro={erros.senha}
        />
        <RequisitosSenha senha={dados.senha} className="-mt-2" />
        <CampoSenha
          rotulo="Confirme sua senha"
          obrigatorio
          valor={dados.confirmarSenha}
          aoMudar={(v) => mudar("confirmarSenha", v)}
          placeholder="Digite a senha novamente"
          autoComplete="new-password"
          erro={erros.confirmarSenha}
          ajuda={dados.confirmarSenha && dados.confirmarSenha === dados.senha ? "As senhas conferem." : undefined}
        />
      </GrupoCampos>
      )}

      <GrupoCampos indice={social ? "3" : "4"} titulo="Privacidade">
        <Consentimentos tipo="usuaria" valores={dados} aoMudar={mudar} erros={erros} />
      </GrupoCampos>

      {mensagem && <Aviso tipo="erro">{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando}>
        {carregando ? "Criando conta..." : "Criar minha conta"}
      </Botao>
    </TelaAcesso>
  );
}

export default Cadastro;
