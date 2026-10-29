// "São Paulo • Híbrido" -> { cidade: "São Paulo", modalidade: "Híbrido" }
export function separarLocalizacao(localizacao = "") {
  const [cidade, modalidade] = localizacao.split("•").map((parte) => parte.trim());
  return { cidade, modalidade };
}
