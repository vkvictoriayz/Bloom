import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { notificar } from "./notificacoes.js";

// Exclusão definitiva de uma conta e de tudo o que é dela (LGPD). Roda numa
// transação só: ou apaga tudo, ou nada. A ordem segue as chaves estrangeiras
// do banco (filhos antes dos pais).
//
// Fica guardado só o registro financeiro (ASSINATURA e PAGAMENTO: plano, valor,
// data e o código do Mercado Pago), sem dado pessoal além do id numérico da
// conta, que deixa de existir. A conta com assinatura ativa não é excluída
// (ver AuthController.excluirConta).

async function ids(sql, replacements, transaction) {
  const linhas = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT, transaction });
  return linhas.map((l) => Object.values(l)[0]);
}

async function apagar(sql, replacements, transaction) {
  await sequelize.query(sql, { replacements, transaction });
}

// Listas vazias viram [0] para o "IN (...)" continuar válido.
const lista = (valores) => (valores.length ? valores : [0]);

export async function excluirUsuaria(id) {
  await sequelize.transaction(async (t) => {
    const conversas = lista(await ids("SELECT id_conversa FROM CONVERSA WHERE id_usuario = :id", { id }, t));
    const candidaturas = lista(await ids("SELECT id_candidatura FROM CANDIDATURAS WHERE id_usuario = :id", { id }, t));
    const publicacoes = lista(await ids("SELECT id_publicacao FROM PUBLICACAO WHERE id_usuario = :id", { id }, t));
    const criadas = lista(await ids("SELECT id_comunidade FROM COMUNIDADE WHERE id_criadora = :id", { id }, t));
    const r = { id, conversas, candidaturas, publicacoes, criadas };

    await apagar("DELETE FROM MENSAGEM WHERE id_conversa IN (:conversas)", r, t);
    await apagar("DELETE FROM CONVERSA WHERE id_conversa IN (:conversas)", r, t);
    await apagar("DELETE FROM NOTIFICACAO WHERE tipo_conta = 'usuaria' AND id_conta = :id", r, t);
    await apagar("DELETE FROM PREFERENCIA_NOTIFICACAO WHERE tipo_conta = 'usuaria' AND id_conta = :id", r, t);
    await apagar("DELETE FROM CONVITE WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM CANDIDATURA_ENVIO WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM CANDIDATURA_CURRICULO WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM CANDIDATURAS WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM CURRICULO_CANDIDATA WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM FAVORITOS WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM PROJETO_CANDIDATA WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM PERFIL_CANDIDATA_DETALHES WHERE id_usuario = :id", r, t);
    // EXPERIENCIA, FORMACAO e PERFIL_HABILIDADE saem em cascata com PERFIL_USUARIA.
    await apagar("DELETE FROM PERFIL_USUARIA WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM CONFIG_USUARIA WHERE id_usuaria = :id", r, t);
    // Comunidades criadas por ela deixam de existir; as que ela só participa ficam.
    await apagar("DELETE FROM COMUNIDADE_PUBLICACAO WHERE id_comunidade IN (:criadas) OR id_publicacao IN (:publicacoes)", r, t);
    await apagar("DELETE FROM COMUNIDADE_MEMBRO WHERE id_comunidade IN (:criadas) OR id_usuario = :id", r, t);
    await apagar("DELETE FROM COMUNIDADE WHERE id_comunidade IN (:criadas)", r, t);
    await apagar("DELETE FROM CURTIDA WHERE id_usuario = :id OR id_publicacao IN (:publicacoes)", r, t);
    await apagar("DELETE FROM COMENTARIO WHERE id_usuario = :id OR id_publicacao IN (:publicacoes)", r, t);
    await apagar("DELETE FROM PUBLICACAO_IMAGEM WHERE id_publicacao IN (:publicacoes)", r, t);
    await apagar("DELETE FROM PUBLICACAO WHERE id_publicacao IN (:publicacoes)", r, t);
    await apagar(
      "DELETE FROM MENSAGEM_DIRETA WHERE id_conversa_direta IN (SELECT id_conversa_direta FROM CONVERSA_DIRETA WHERE id_usuaria_a = :id OR id_usuaria_b = :id)",
      r,
      t
    );
    await apagar("DELETE FROM CONVERSA_DIRETA WHERE id_usuaria_a = :id OR id_usuaria_b = :id", r, t);
    await apagar("DELETE FROM ICONE_PERFIL WHERE dono_tipo = 'usuaria' AND dono_id = :id", r, t);
    await apagar("DELETE FROM CONEXAO WHERE id_seguidora = :id OR id_seguida = :id", r, t);
    await apagar("DELETE FROM PERFIL_COMUNIDADE WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM IMAGEM_PERFIL WHERE dono_tipo = 'usuaria' AND dono_id = :id", r, t);
    await apagar("DELETE FROM REDEFINICAO_SENHA WHERE tipo_conta = 'usuaria' AND id_conta = :id", r, t);
    await apagar("DELETE FROM USUARIA_VERIFICACAO WHERE id_usuario = :id", r, t);
    await apagar("DELETE FROM CADASTRO_USUARIA WHERE id_usuario = :id", r, t);
  });
}

export async function excluirEmpresa(id) {
  // Avisos às candidatas com candidatura nas vagas da empresa (antes de apagar).
  const afetadas = await sequelize.query(
    `SELECT DISTINCT c.id_usuario, v.titulo, e.nome FROM CANDIDATURAS c
       JOIN VAGAS v ON v.id_vaga = c.id_vaga
       JOIN PERFIL_EMPRESA p ON p.id_perfil_empresa = v.id_perfil_empresa
       JOIN CADASTRO_EMPRESA e ON e.id_empresa = p.id_empresa
     WHERE p.id_empresa = :id`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  await sequelize.transaction(async (t) => {
    const vagas = lista(await ids("SELECT v.id_vaga FROM VAGAS v JOIN PERFIL_EMPRESA p ON p.id_perfil_empresa = v.id_perfil_empresa WHERE p.id_empresa = :id", { id }, t));
    const candidaturas = lista(await ids("SELECT id_candidatura FROM CANDIDATURAS WHERE id_vaga IN (:vagas)", { vagas }, t));
    const conversas = lista(await ids("SELECT id_conversa FROM CONVERSA WHERE id_empresa = :id", { id }, t));
    const r = { id, vagas, candidaturas, conversas };

    await apagar("DELETE FROM MENSAGEM WHERE id_conversa IN (:conversas)", r, t);
    await apagar("DELETE FROM CONVERSA WHERE id_conversa IN (:conversas)", r, t);
    await apagar("DELETE FROM NOTIFICACAO WHERE tipo_conta = 'empresa' AND id_conta = :id", r, t);
    await apagar("DELETE FROM PREFERENCIA_NOTIFICACAO WHERE tipo_conta = 'empresa' AND id_conta = :id", r, t);
    await apagar("DELETE FROM CONVITE WHERE id_empresa = :id OR id_vaga IN (:vagas)", r, t);
    // Campanhas saem; os pagamentos delas ficam (registro financeiro), sem o vínculo.
    await apagar("UPDATE PAGAMENTO SET id_campanha = NULL WHERE id_campanha IN (SELECT id_campanha FROM CAMPANHA WHERE id_empresa = :id)", r, t);
    await apagar("DELETE FROM CAMPANHA WHERE id_empresa = :id", r, t);
    await apagar("DELETE FROM ICONE_PERFIL WHERE dono_tipo = 'empresa' AND dono_id = :id", r, t);
    await apagar("DELETE FROM CANDIDATURA_ENVIO WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM CANDIDATURA_CURRICULO WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM CANDIDATURAS WHERE id_candidatura IN (:candidaturas)", r, t);
    await apagar("DELETE FROM FAVORITOS WHERE id_vaga IN (:vagas)", r, t);
    await apagar("DELETE FROM VAGAS WHERE id_vaga IN (:vagas)", r, t);
    await apagar("DELETE FROM PUBLICACAO_EMPRESA WHERE id_empresa = :id", r, t);
    await apagar("DELETE FROM PERFIL_EMPRESA WHERE id_empresa = :id", r, t);
    await apagar("DELETE FROM CONFIG_EMPRESA WHERE id_empresa = :id", r, t);
    await apagar("DELETE FROM EMPRESA_DADOS_CADASTRAIS WHERE id_empresa = :id", r, t);
    await apagar("DELETE FROM IMAGEM_PERFIL WHERE dono_tipo = 'empresa' AND dono_id = :id", r, t);
    await apagar("DELETE FROM REDEFINICAO_SENHA WHERE tipo_conta = 'empresa' AND id_conta = :id", r, t);
    await apagar("DELETE FROM CADASTRO_EMPRESA WHERE id_empresa = :id", r, t);
  });

  for (const a of afetadas) {
    await notificar({
      tipoConta: "usuaria",
      contaId: a.id_usuario,
      tipo: "candidatura",
      texto: `${a.nome} encerrou a conta na Bloom. A vaga ${a.titulo} e sua candidatura foram removidas.`,
      link: "/candidata/candidaturas",
    });
  }
}
