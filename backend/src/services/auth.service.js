import { somenteDigitos, validarCNPJ, validarCPF } from "../utils/documentos.js";
import { conferirSenha, gerarHash } from "../utils/senha.js";
import { criarToken } from "../utils/jwt.js";

export class ErroHttp extends Error {
  constructor(status, mensagem, campo) {
    super(mensagem);
    this.status = status;
    this.campo = campo;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarEmail(email) {
  if (!email || email.length > 150 || !EMAIL_REGEX.test(email)) {
    throw new ErroHttp(400, "Digite um e-mail válido!", "email");
  }
}

function validarSenha(senha, confirmarSenha) {
  if (typeof senha !== "string" || senha.length < 8) {
    throw new ErroHttp(400, "A senha deve ter pelo menos 8 caracteres!", "senha");
  }
  if (senha.length > 128) {
    throw new ErroHttp(400, "A senha deve ter no máximo 128 caracteres!", "senha");
  }
  if (confirmarSenha !== undefined && senha !== confirmarSenha) {
    throw new ErroHttp(400, "As senhas não são iguais!", "confirmarSenha");
  }
}

function validarTelefone(telefone) {
  if (telefone && (telefone.length < 10 || telefone.length > 13)) {
    throw new ErroHttp(400, "Digite um telefone válido com DDD!", "telefone");
  }
}

// Se o MySQL acusar duplicidade (corrida entre duas requisições), traduz o erro.
function traduzirErroDuplicado(erro, campos) {
  if (erro?.code !== "ER_DUP_ENTRY") return erro;
  const msg = String(erro.sqlMessage ?? "").toLowerCase();
  for (const [campo, mensagem] of Object.entries(campos)) {
    if (msg.includes(campo)) return new ErroHttp(409, mensagem, campo);
  }
  return new ErroHttp(409, "Cadastro já existente.");
}

export function criarAuthService({ db, jwtSecret, jwtExpiresHours = 8 }) {
  // Hash falso usado quando o e-mail não existe, para o login levar o mesmo
  // tempo nos dois casos (evita descobrir e-mails cadastrados pelo tempo).
  let hashFalso;
  async function obterHashFalso() {
    hashFalso ??= await gerarHash("senha-falsa-para-igualar-tempo");
    return hashFalso;
  }

  function montarSessao(conta, tipo) {
    const token = criarToken(
      { sub: conta.id, tipo, nome: conta.nome },
      jwtSecret,
      jwtExpiresHours * 3600
    );
    return { token, usuario: { id: conta.id, nome: conta.nome, email: conta.email, tipo } };
  }

  async function login({ tabela, colunaId, email, senha, tipo }) {
    const emailLimpo = texto(email).toLowerCase();

    if (!emailLimpo || typeof senha !== "string" || !senha) {
      throw new ErroHttp(400, "Preencha todos os campos!");
    }
    validarEmail(emailLimpo);

    const linhas = await db.query(
      `SELECT ${colunaId} AS id, nome, email, senha_hash FROM ${tabela} WHERE email = ? LIMIT 1`,
      [emailLimpo]
    );
    const conta = linhas[0];

    const senhaOk = await conferirSenha(senha, conta ? conta.senha_hash : await obterHashFalso());

    if (!conta || !senhaOk) {
      throw new ErroHttp(401, "E-mail ou senha incorretos!");
    }

    return montarSessao(conta, tipo);
  }

  return {
    // ---------- Usuária ----------
    async cadastrarUsuaria(dados = {}) {
      const nome = texto(dados.nome);
      const email = texto(dados.email).toLowerCase();
      const cpf = somenteDigitos(dados.cpf);
      const telefone = somenteDigitos(dados.telefone);
      const { senha, confirmarSenha } = dados;

      if (!nome || !email || !cpf || !senha) {
        throw new ErroHttp(400, "Preencha todos os campos!");
      }
      if (nome.length < 2 || nome.length > 100) {
        throw new ErroHttp(400, "O nome deve ter entre 2 e 100 caracteres!", "nome");
      }
      validarEmail(email);
      if (!validarCPF(cpf)) {
        throw new ErroHttp(400, "Digite um CPF válido!", "cpf");
      }
      validarTelefone(telefone);
      validarSenha(senha, confirmarSenha);

      const existentes = await db.query(
        "SELECT cpf, email FROM CADASTRO_USUARIA WHERE cpf = ? OR email = ?",
        [cpf, email]
      );
      if (existentes.some((u) => u.cpf === cpf)) {
        throw new ErroHttp(409, "Este CPF já está cadastrado!", "cpf");
      }
      if (existentes.some((u) => u.email === email)) {
        throw new ErroHttp(409, "Este e-mail já está cadastrado!", "email");
      }

      const senhaHash = await gerarHash(senha);

      try {
        const id = await db.transacao(async (tx) => {
          const r = await tx.query(
            `INSERT INTO CADASTRO_USUARIA (nome, cpf, email, telefone, senha_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, cpf, email, telefone || null, senhaHash]
          );
          const idUsuario = r.insertId;

          await tx.query("INSERT INTO PERFIL_USUARIA (id_usuario) VALUES (?)", [idUsuario]);
          await tx.query(
            `INSERT INTO CONFIG_USUARIA
               (id_usuaria, perfil_publico, receber_notif_email, mostrar_experiencia,
                mostrar_contato, idioma_preferido, modo_noturno)
             VALUES (?, TRUE, TRUE, TRUE, FALSE, 'pt-BR', FALSE)`,
            [idUsuario]
          );
          return idUsuario;
        });

        return montarSessao({ id, nome, email }, "usuaria");
      } catch (erro) {
        throw traduzirErroDuplicado(erro, {
          cpf: "Este CPF já está cadastrado!",
          email: "Este e-mail já está cadastrado!",
        });
      }
    },

    loginUsuaria({ email, senha } = {}) {
      return login({
        tabela: "CADASTRO_USUARIA",
        colunaId: "id_usuario",
        email,
        senha,
        tipo: "usuaria",
      });
    },

    // ---------- Empresa ----------
    async cadastrarEmpresa(dados = {}) {
      const nome = texto(dados.nome);
      const email = texto(dados.email).toLowerCase();
      const cnpj = somenteDigitos(dados.cnpj);
      const telefone = somenteDigitos(dados.telefone);
      const { senha, confirmarSenha } = dados;

      if (!nome || !email || !cnpj || !senha) {
        throw new ErroHttp(400, "Preencha todos os campos!");
      }
      if (nome.length < 2 || nome.length > 150) {
        throw new ErroHttp(400, "O nome deve ter entre 2 e 150 caracteres!", "nome");
      }
      validarEmail(email);
      if (!validarCNPJ(cnpj)) {
        throw new ErroHttp(400, "Digite um CNPJ válido!", "cnpj");
      }
      validarTelefone(telefone);
      validarSenha(senha, confirmarSenha);

      const existentes = await db.query(
        "SELECT cnpj, email FROM CADASTRO_EMPRESA WHERE cnpj = ? OR email = ?",
        [cnpj, email]
      );
      if (existentes.some((e) => e.cnpj === cnpj)) {
        throw new ErroHttp(409, "Este CNPJ já está cadastrado!", "cnpj");
      }
      if (existentes.some((e) => e.email === email)) {
        throw new ErroHttp(409, "Este e-mail já está cadastrado!", "email");
      }

      const senhaHash = await gerarHash(senha);

      try {
        const id = await db.transacao(async (tx) => {
          const r = await tx.query(
            `INSERT INTO CADASTRO_EMPRESA (nome, cnpj, email, telefone, senha_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, cnpj, email, telefone || null, senhaHash]
          );
          const idEmpresa = r.insertId;

          await tx.query("INSERT INTO PERFIL_EMPRESA (id_empresa) VALUES (?)", [idEmpresa]);
          await tx.query(
            `INSERT INTO CONFIG_EMPRESA
               (id_empresa, perfil_publico, receber_notif_email, mostrar_vagas,
                mostrar_contato, idioma_preferido, modo_noturno)
             VALUES (?, TRUE, TRUE, TRUE, FALSE, 'pt-BR', FALSE)`,
            [idEmpresa]
          );
          return idEmpresa;
        });

        return montarSessao({ id, nome, email }, "empresa");
      } catch (erro) {
        throw traduzirErroDuplicado(erro, {
          cnpj: "Este CNPJ já está cadastrado!",
          email: "Este e-mail já está cadastrado!",
        });
      }
    },

    loginEmpresa({ email, senha } = {}) {
      return login({
        tabela: "CADASTRO_EMPRESA",
        colunaId: "id_empresa",
        email,
        senha,
        tipo: "empresa",
      });
    },

    // ---------- Sessão atual ----------
    async buscarConta(tipo, id) {
      const [tabela, colunaId] =
        tipo === "empresa"
          ? ["CADASTRO_EMPRESA", "id_empresa"]
          : ["CADASTRO_USUARIA", "id_usuario"];

      const linhas = await db.query(
        `SELECT ${colunaId} AS id, nome, email FROM ${tabela} WHERE ${colunaId} = ? LIMIT 1`,
        [id]
      );
      if (!linhas[0]) throw new ErroHttp(401, "Sessão inválida. Faça login novamente.");
      return { ...linhas[0], tipo };
    },
  };
}
