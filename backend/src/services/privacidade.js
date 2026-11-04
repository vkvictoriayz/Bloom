import { Op } from "sequelize";
import { ConfigUsuaria } from "../models/Candidata.js";

// Privacidade da candidata (tabela CONFIG_USUARIA, do banco original).
// Sem linha salva valem os padrões abaixo.
export const PADRAO = { perfilPublico: true, mostrarExperiencia: false, mostrarContato: false };

const deLinha = (c) =>
  c
    ? {
        perfilPublico: c.perfilPublico ?? PADRAO.perfilPublico,
        mostrarExperiencia: c.mostrarExperiencia ?? PADRAO.mostrarExperiencia,
        mostrarContato: c.mostrarContato ?? PADRAO.mostrarContato,
      }
    : { ...PADRAO };

// Map(id -> { perfilPublico, mostrarExperiencia, mostrarContato })
export async function privacidadeDe(ids) {
  const unicos = [...new Set(ids)].filter(Boolean);
  const mapa = new Map(unicos.map((id) => [id, { ...PADRAO }]));
  if (!unicos.length) return mapa;
  const linhas = await ConfigUsuaria.findAll({ where: { usuariaId: { [Op.in]: unicos } } });
  for (const l of linhas) mapa.set(l.usuariaId, deLinha(l));
  return mapa;
}

// Ids de quem escolheu esconder o perfil (não aparece em buscas e listas).
export async function perfisOcultos() {
  const linhas = await ConfigUsuaria.findAll({ attributes: ["usuariaId"], where: { perfilPublico: false } });
  return new Set(linhas.map((l) => l.usuariaId));
}

export { deLinha };
