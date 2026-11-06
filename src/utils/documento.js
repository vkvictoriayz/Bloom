// Validação do currículo enviado (base64 + nome do arquivo). O tipo vem da
// extensão e precisa bater com os primeiros bytes do arquivo.

export const LIMITE_CURRICULO = 5 * 1024 * 1024; // 5 MB

const TIPOS = {
  pdf: { mime: "application/pdf", confere: (b) => b.toString("ascii", 0, 5) === "%PDF-" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    confere: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  },
  doc: {
    mime: "application/msword",
    confere: (b) => b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  },
};

// Devolve { nomeArquivo, mime, dados } ou { erro }.
export function lerCurriculo(nome, base64) {
  const limpo = String(nome ?? "")
    .split(/[\\/]/)
    .pop()
    .split("")
    // sem caracteres de controle nem os proibidos em nomes de arquivo
    .filter((c) => c.charCodeAt(0) >= 32 && !'<>:"|?*'.includes(c))
    .join("")
    .trim();
  const extensao = /\.([a-z0-9]+)$/i.exec(limpo)?.[1]?.toLowerCase();
  const tipo = TIPOS[extensao];
  if (!limpo || !tipo) return { erro: "Envie o currículo em PDF, DOC ou DOCX." };
  const conteudo = String(base64 ?? "").replace(/^data:[^,]*;base64,/, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(conteudo)) return { erro: "Arquivo inválido." };
  const dados = Buffer.from(conteudo, "base64");
  if (!dados.length || dados.length > LIMITE_CURRICULO) return { erro: "O currículo deve ter até 5 MB." };
  if (!tipo.confere(dados)) return { erro: `O arquivo não parece um ${extensao.toUpperCase()} válido.` };
  const base = limpo.slice(0, limpo.length - extensao.length - 1).slice(0, 140) || "curriculo";
  return { nomeArquivo: `${base}.${extensao}`, mime: tipo.mime, dados };
}
