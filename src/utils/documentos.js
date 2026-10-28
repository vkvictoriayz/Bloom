export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Mesma regra do backend (o backend é quem decide de verdade).
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
