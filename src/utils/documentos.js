// Validação de CPF e CNPJ (dígitos verificadores).
// Observação: isso confirma que o número é *matematicamente válido*,
// não que ele exista na Receita Federal.

export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function validarCPF(valor) {
  const cpf = somenteDigitos(valor);

  if (cpf.length !== 11) return false;

  // 000.000.000-00, 111.111.111-11 etc. passam na conta, mas são inválidos
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split("").map(Number);

  const calcularDigito = (qtd) => {
    let soma = 0;
    for (let i = 0; i < qtd; i++) {
      soma += digitos[i] * (qtd + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(9) === digitos[9] && calcularDigito(10) === digitos[10];
}

export function validarCNPJ(valor) {
  const cnpj = somenteDigitos(valor);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digitos = cnpj.split("").map(Number);

  const calcularDigito = (qtd) => {
    const pesos =
      qtd === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < qtd; i++) {
      soma += digitos[i] * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calcularDigito(12) === digitos[12] && calcularDigito(13) === digitos[13];
}
