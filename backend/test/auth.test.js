import assert from "node:assert/strict";
import { test } from "node:test";
import { validarCNPJ, validarCPF } from "../src/utils/documentos.js";
import { conferirSenha, gerarHash } from "../src/utils/senha.js";
import { criarToken, verificarToken } from "../src/utils/jwt.js";
import { criarAuthService, ErroHttp } from "../src/services/auth.service.js";

// ---------- CPF / CNPJ ----------
test("CPF válido (com e sem máscara)", () => {
  assert.equal(validarCPF("529.982.247-25"), true);
  assert.equal(validarCPF("52998224725"), true);
  assert.equal(validarCPF("111.444.777-35"), true);
});

test("CPF inválido", () => {
  assert.equal(validarCPF("529.982.247-24"), false); // dígito errado
  assert.equal(validarCPF("111.111.111-11"), false); // repetido
  assert.equal(validarCPF("000.000.000-00"), false);
  assert.equal(validarCPF("123"), false);
  assert.equal(validarCPF(""), false);
  assert.equal(validarCPF(undefined), false);
});

test("CNPJ válido e inválido", () => {
  assert.equal(validarCNPJ("11.222.333/0001-81"), true);
  assert.equal(validarCNPJ("11444777000161"), true);
  assert.equal(validarCNPJ("11.222.333/0001-82"), false);
  assert.equal(validarCNPJ("00000000000000"), false);
  assert.equal(validarCNPJ("123"), false);
});

// ---------- senha e JWT ----------
test("hash de senha confere só com a senha certa", async () => {
  const hash = await gerarHash("minhaSenha123");
  assert.ok(hash.length <= 255);
  assert.equal(await conferirSenha("minhaSenha123", hash), true);
  assert.equal(await conferirSenha("outraSenha", hash), false);
  assert.equal(await conferirSenha("x", "lixo"), false);
});

test("JWT: válido, adulterado, assinatura errada e expirado", () => {
  const token = criarToken({ sub: 7, tipo: "usuaria" }, "segredo-de-teste-123", 60);
  assert.equal(verificarToken(token, "segredo-de-teste-123").sub, 7);
  assert.equal(verificarToken(token, "outro-segredo-123456"), null);

  const [h, , s] = token.split(".");
  const falso = Buffer.from(JSON.stringify({ sub: 1, tipo: "empresa", exp: 9999999999 })).toString("base64url");
  assert.equal(verificarToken(`${h}.${falso}.${s}`, "segredo-de-teste-123"), null);

  const expirado = criarToken({ sub: 7 }, "segredo-de-teste-123", -10);
  assert.equal(verificarToken(expirado, "segredo-de-teste-123"), null);
  assert.equal(verificarToken("nada", "segredo-de-teste-123"), null);
});

// ---------- serviço (com banco falso em memória) ----------
function criarBancoFalso() {
  const tabelas = { usuarias: [], empresas: [], queries: [] };
  let proximoId = 1;
  const falho = { ativo: false };

  const executar = async (sql, params) => {
    tabelas.queries.push(sql.replace(/\s+/g, " ").trim().slice(0, 40));
    if (sql.includes("FROM CADASTRO_USUARIA WHERE cpf")) {
      return tabelas.usuarias.filter((u) => u.cpf === params[0] || u.email === params[1]);
    }
    if (sql.includes("FROM CADASTRO_EMPRESA WHERE cnpj")) {
      return tabelas.empresas.filter((e) => e.cnpj === params[0] || e.email === params[1]);
    }
    if (sql.startsWith("INSERT INTO CADASTRO_USUARIA")) {
      const [nome, cpf, email, telefone, senha_hash] = params;
      tabelas.usuarias.push({ id: proximoId, nome, cpf, email, telefone, senha_hash });
      return { insertId: proximoId++ };
    }
    if (sql.startsWith("INSERT INTO CADASTRO_EMPRESA")) {
      const [nome, cnpj, email, telefone, senha_hash] = params;
      tabelas.empresas.push({ id: proximoId, nome, cnpj, email, telefone, senha_hash });
      return { insertId: proximoId++ };
    }
    if (sql.startsWith("INSERT INTO PERFIL") || sql.startsWith("INSERT INTO CONFIG")) {
      if (falho.ativo) throw new Error("falha simulada");
      return { insertId: 1 };
    }
    if (sql.includes("FROM CADASTRO_USUARIA WHERE email")) {
      return tabelas.usuarias.filter((u) => u.email === params[0]);
    }
    if (sql.includes("FROM CADASTRO_EMPRESA WHERE email")) {
      return tabelas.empresas.filter((e) => e.email === params[0]);
    }
    throw new Error("query inesperada: " + sql);
  };

  return {
    tabelas,
    falho,
    query: executar,
    async transacao(cb) {
      const copia = { u: [...tabelas.usuarias], e: [...tabelas.empresas] };
      try {
        return await cb({ query: executar });
      } catch (erro) {
        tabelas.usuarias = copia.u; // rollback
        tabelas.empresas = copia.e;
        throw erro;
      }
    },
  };
}

const SEGREDO = "segredo-de-teste-123";
const dadosValidos = {
  nome: "Maria Silva",
  cpf: "529.982.247-25",
  email: "Maria@Email.com ",
  telefone: "(11) 91234-5678",
  senha: "senhaForte1",
  confirmarSenha: "senhaForte1",
};

async function erroDe(promessa) {
  try {
    await promessa;
  } catch (e) {
    return e;
  }
  return null;
}

test("cadastro de usuária: sucesso, normaliza dados e não guarda senha pura", async () => {
  const db = criarBancoFalso();
  const auth = criarAuthService({ db, jwtSecret: SEGREDO });

  const r = await auth.cadastrarUsuaria(dadosValidos);

  assert.equal(r.usuario.email, "maria@email.com");
  assert.equal(r.usuario.tipo, "usuaria");
  assert.equal(verificarToken(r.token, SEGREDO).sub, r.usuario.id);

  const salvo = db.tabelas.usuarias[0];
  assert.equal(salvo.cpf, "52998224725");
  assert.equal(salvo.telefone, "11912345678");
  assert.notEqual(salvo.senha_hash, "senhaForte1");
  assert.ok(salvo.senha_hash.startsWith("scrypt$"));
});

test("cadastro: CPF inválido é recusado e nada é gravado", async () => {
  const db = criarBancoFalso();
  const auth = criarAuthService({ db, jwtSecret: SEGREDO });

  const e = await erroDe(auth.cadastrarUsuaria({ ...dadosValidos, cpf: "111.111.111-11" }));
  assert.ok(e instanceof ErroHttp);
  assert.equal(e.status, 400);
  assert.equal(e.campo, "cpf");
  assert.equal(db.tabelas.usuarias.length, 0);
});

test("cadastro: CPF e e-mail duplicados dão 409", async () => {
  const db = criarBancoFalso();
  const auth = criarAuthService({ db, jwtSecret: SEGREDO });
  await auth.cadastrarUsuaria(dadosValidos);

  const porCpf = await erroDe(auth.cadastrarUsuaria({ ...dadosValidos, email: "outra@email.com" }));
  assert.equal(porCpf.status, 409);
  assert.equal(porCpf.campo, "cpf");

  const porEmail = await erroDe(
    auth.cadastrarUsuaria({ ...dadosValidos, cpf: "111.444.777-35" })
  );
  assert.equal(porEmail.status, 409);
  assert.equal(porEmail.campo, "email");
});

test("cadastro: validações de campos", async () => {
  const auth = criarAuthService({ db: criarBancoFalso(), jwtSecret: SEGREDO });
  const casos = [
    [{ ...dadosValidos, nome: "" }, 400],
    [{ ...dadosValidos, email: "sem-arroba" }, 400],
    [{ ...dadosValidos, senha: "curta", confirmarSenha: "curta" }, 400],
    [{ ...dadosValidos, confirmarSenha: "diferente123" }, 400],
    [{ ...dadosValidos, telefone: "123" }, 400],
    [undefined, 400],
  ];
  for (const [dados, status] of casos) {
    const e = await erroDe(auth.cadastrarUsuaria(dados));
    assert.equal(e?.status, status, JSON.stringify(dados));
  }
});

test("cadastro: falha ao criar perfil desfaz o cadastro (transação)", async () => {
  const db = criarBancoFalso();
  db.falho.ativo = true;
  const auth = criarAuthService({ db, jwtSecret: SEGREDO });

  const e = await erroDe(auth.cadastrarUsuaria(dadosValidos));
  assert.ok(e);
  assert.equal(db.tabelas.usuarias.length, 0);
});

test("cadastro: corrida com ER_DUP_ENTRY vira 409", async () => {
  const db = criarBancoFalso();
  db.transacao = async () => {
    const erro = new Error("dup");
    erro.code = "ER_DUP_ENTRY";
    erro.sqlMessage = "Duplicate entry '5299' for key 'cadastro_usuaria.cpf'";
    throw erro;
  };
  const auth = criarAuthService({ db, jwtSecret: SEGREDO });
  const e = await erroDe(auth.cadastrarUsuaria(dadosValidos));
  assert.equal(e.status, 409);
  assert.equal(e.campo, "cpf");
});

test("login de usuária: ok, senha errada, e-mail inexistente, campos vazios", async () => {
  const auth = criarAuthService({ db: criarBancoFalso(), jwtSecret: SEGREDO });
  await auth.cadastrarUsuaria(dadosValidos);

  const ok = await auth.loginUsuaria({ email: "MARIA@email.com", senha: "senhaForte1" });
  assert.equal(ok.usuario.nome, "Maria Silva");
  assert.ok(verificarToken(ok.token, SEGREDO));
  assert.equal(JSON.stringify(ok).includes("senha_hash"), false);

  const errada = await erroDe(auth.loginUsuaria({ email: "maria@email.com", senha: "errada123" }));
  const inexistente = await erroDe(auth.loginUsuaria({ email: "x@email.com", senha: "senhaForte1" }));
  assert.equal(errada.status, 401);
  assert.equal(inexistente.status, 401);
  assert.equal(errada.message, inexistente.message); // não revela qual dos dois falhou

  assert.equal((await erroDe(auth.loginUsuaria({ email: "", senha: "" }))).status, 400);
  assert.equal((await erroDe(auth.loginUsuaria({}))).status, 400);
});

test("empresa: cadastro com CNPJ, login e separação de tipos", async () => {
  const auth = criarAuthService({ db: criarBancoFalso(), jwtSecret: SEGREDO });

  const invalido = await erroDe(
    auth.cadastrarEmpresa({ nome: "Acme", email: "rh@acme.com", cnpj: "11.222.333/0001-82", senha: "senhaForte1" })
  );
  assert.equal(invalido.campo, "cnpj");

  const r = await auth.cadastrarEmpresa({
    nome: "Acme", email: "rh@acme.com", cnpj: "11.222.333/0001-81", senha: "senhaForte1",
  });
  assert.equal(r.usuario.tipo, "empresa");

  const login = await auth.loginEmpresa({ email: "rh@acme.com", senha: "senhaForte1" });
  assert.equal(verificarToken(login.token, SEGREDO).tipo, "empresa");

  // conta de empresa não entra pelo login de usuária
  const cruzado = await erroDe(auth.loginUsuaria({ email: "rh@acme.com", senha: "senhaForte1" }));
  assert.equal(cruzado.status, 401);
});
