import { Op } from "sequelize";
import { Habilidade, PerfilDetalhes, PerfilHabilidade, PerfilUsuaria } from "../models/Candidata.js";
import { notificar } from "./notificacoes.js";

// Quando uma vaga é publicada, avisa as candidatas cujo perfil combina com ela:
// alguma competência técnica citada no título, área, requisitos ou descrição,
// ou a área da vaga entre as áreas de interesse das preferências.
// Quem desligou "vagas compatíveis" não recebe (ver notificar()).

const normal = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function avisarVagaCompativel(vaga, nomeEmpresa) {
  try {
    const textoVaga = normal([vaga.titulo, vaga.area, vaga.requisitos, vaga.descricao].join(" "));
    const areaVaga = normal(vaga.area);

    const [perfis, detalhes] = await Promise.all([
      PerfilUsuaria.findAll({ attributes: ["id", "usuariaId"], limit: 2000 }),
      PerfilDetalhes.findAll({ attributes: ["usuariaId", "preferencias"], limit: 2000 }),
    ]);
    const ligacoes = perfis.length ? await PerfilHabilidade.findAll({ where: { perfilId: { [Op.in]: perfis.map((p) => p.id) } } }) : [];
    const habilidades = ligacoes.length ? await Habilidade.findAll({ where: { id: { [Op.in]: [...new Set(ligacoes.map((l) => l.habilidadeId))] } } }) : [];
    const nomeHab = new Map(habilidades.map((h) => [h.id, normal(h.nome)]));
    const usuariaDoPerfil = new Map(perfis.map((p) => [p.id, p.usuariaId]));

    const alvo = new Set();
    for (const l of ligacoes) {
      const nome = nomeHab.get(l.habilidadeId);
      // Competências curtas (ex.: "C", "R") só contam como palavra inteira.
      const casa = nome && (nome.length > 2 ? textoVaga.includes(nome) : new RegExp(`\\b${nome}\\b`).test(textoVaga));
      if (casa) alvo.add(usuariaDoPerfil.get(l.perfilId));
    }
    if (areaVaga) {
      for (const d of detalhes) {
        if ((d.preferencias?.areas ?? []).some((a) => normal(a) === areaVaga)) alvo.add(d.usuariaId);
      }
    }

    for (const usuariaId of alvo) {
      await notificar({
        tipoConta: "usuaria",
        contaId: usuariaId,
        tipo: "vaga",
        texto: `Vaga compatível com o seu perfil: ${vaga.titulo}${nomeEmpresa ? ` (${nomeEmpresa})` : ""}.`,
        link: `/vagas/b${vaga.id}`,
        chave: `vaga-${vaga.id}`,
      });
    }
    return alvo.size;
  } catch (e) {
    console.error("Falha ao avisar vagas compatíveis:", e.message);
    return 0;
  }
}
