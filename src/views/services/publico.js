import { api } from "./api.js";
import { converterVaga } from "./vagasApi";
import { iniciais } from "../hooks/useSessao";

const consulta = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `?${q}` : "";
};

function comMarca(empresa) {
  return { ...empresa, sigla: iniciais(empresa.nome) || "E", cor: "#f4e4e9", corTexto: "#85243d" };
}

export const listarEmpresasPublicas = ({ busca = "", area = "", comVagas = false } = {}) =>
  api(`/publico/empresas${consulta({ busca, area, comVagas: comVagas ? "1" : "" })}`).then((r) => ({ ...r, empresas: r.empresas.map(comMarca) }));

export const lerPerfilPublicoEmpresa = (id) => api(`/publico/empresas/${encodeURIComponent(id)}`).then((r) => ({ ...r, empresa: comMarca(r.empresa), vagas: r.vagas.map(converterVaga) }));

export const lerResumoPublico = () => api("/publico/resumo");

export const textoVagas = (n) => (n ? `${n} ${n === 1 ? "vaga aberta" : "vagas abertas"}` : "Sem vagas abertas");
