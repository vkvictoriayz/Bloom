import { sequelize } from "../config/database.js";
import { IDENTIDADES_GENERO, UsuariaIdentificacao } from "../models/Identificacao.js";
import { Usuaria } from "../models/index.js";

// Dados de identificação da própria candidata. Rotas protegidas por exigirLogin(["usuaria"]):
// cada candidata só acessa os próprios dados (o id vem do token, nunca da URL).

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const erro = (res, status, mensagem, campo) => res.status(status).json({ erro: mensagem, campo });

// Contas criadas antes desta funcionalidade não têm linha: o nome atual é tratado como nome civil.
async function identificacaoDe(conta, transaction) {
  const [linha] = await UsuariaIdentificacao.findOrCreate({
    where: { usuariaId: conta.id },
    defaults: { usuariaId: conta.id, nomeCivil: conta.nome },
    transaction,
  });
  return linha;
}

const resposta = (conta, linha) => ({
  identificacao: {
    nomeCivil: linha.nomeCivil,
    nomeSocial: linha.nomeSocial ?? "",
    nomeExibido: conta.nome,
    identidadeGenero: linha.identidadeGenero,
  },
});

export async function ler(req, res) {
  try {
    const conta = await Usuaria.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");
    return res.json(resposta(conta, await identificacaoDe(conta)));
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
}

// O nome civil não é editável aqui: ele está ligado à verificação do CPF. Correções: contato@bloom.com.br.
export async function atualizar(req, res) {
  try {
    const conta = await Usuaria.findByPk(req.auth.sub);
    if (!conta) return erro(res, 401, "Sessão inválida. Faça login novamente.");

    const nomeSocial = texto(req.body?.nomeSocial);
    const identidadeGenero = texto(req.body?.identidadeGenero);
    if (nomeSocial && (nomeSocial.length < 2 || nomeSocial.length > 100)) return erro(res, 400, "O nome social deve ter entre 2 e 100 caracteres.", "nomeSocial");
    if (!IDENTIDADES_GENERO.includes(identidadeGenero)) return erro(res, 400, "Escolha uma opção de identidade de gênero.", "identidadeGenero");

    const linha = await sequelize.transaction(async (transaction) => {
      const atual = await identificacaoDe(conta, transaction);
      await atual.update({ nomeSocial: nomeSocial || null, identidadeGenero, atualizadoEm: new Date() }, { transaction });
      await conta.update({ nome: nomeSocial || atual.nomeCivil }, { transaction });
      return atual;
    });
    return res.json({ mensagem: "Dados de identificação atualizados.", ...resposta(conta, linha) });
  } catch (e) {
    console.error(e.name, e.message);
    return erro(res, 500, "Erro interno. Tente novamente mais tarde.");
  }
}

// Chamado quando a candidata troca o nome em "Editar perfil": esse nome passa a ser o nome social.
export async function sincronizarNomeExibido(usuariaId, nome, transaction) {
  const conta = await Usuaria.findByPk(usuariaId, { transaction });
  if (!conta) return;
  const linha = await identificacaoDe(conta, transaction);
  await linha.update({ nomeSocial: nome === linha.nomeCivil ? null : nome, atualizadoEm: new Date() }, { transaction });
}
