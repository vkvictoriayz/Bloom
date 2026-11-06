export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function formatarCPF(valor) {
  const n = somenteDigitos(valor).slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatarTelefone(valor) {
  const n = somenteDigitos(valor).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export function formatarCNPJ(valor) {
  const n = somenteDigitos(valor).slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// Dígitos verificadores: o número é válido, o que não prova que existe nem
// de quem é. A confirmação fica com o servidor e as APIs de consulta.
export function validarCPF(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const d = cpf.split("").map(Number);
  const digito = (qtd) => {
    let soma = 0;
    for (let i = 0; i < qtd; i++) soma += d[i] * (qtd + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === d[9] && digito(10) === d[10];
}

export function validarCNPJ(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d = cnpj.split("").map(Number);
  const digito = (qtd) => {
    const pesos = qtd === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < qtd; i++) soma += d[i] * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(12) === d[12] && digito(13) === d[13];
}
