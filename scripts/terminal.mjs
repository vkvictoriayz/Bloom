const ENTER = new Set(["\r", "\n"]);

export function exigirTerminal() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    console.error("Rode este comando num terminal interativo (as respostas são digitadas na hora).");
    process.exit(1);
  }
}

export function perguntar(texto, { oculto = false, permitirVazio = false } = {}) {
  return new Promise((ok) => {
    const entrada = process.stdin;
    let resposta = "";
    let ignorarProximoLf = false;
    process.stdout.write(texto);
    entrada.setRawMode(true);
    entrada.resume();

    const terminar = () => {
      entrada.off("data", aoDigitar);
      entrada.setRawMode(false);
      entrada.pause();
      process.stdout.write("\n");
      ok(oculto ? resposta : resposta.trim());
    };

    function aoDigitar(buf) {
      for (const c of buf.toString("utf8")) {
        if (c === "\n" && ignorarProximoLf) {
          ignorarProximoLf = false;
          continue;
        }
        ignorarProximoLf = false;
        if (ENTER.has(c)) {
          if (!resposta && !oculto && !permitirVazio) continue;
          return terminar();
        }
        if (c === "\u0003") {
          entrada.setRawMode(false);
          process.stdout.write("\nCancelado.\n");
          process.exit(1);
        }
        if (c === "\u0008" || c === "\u007f") {
          if (resposta) {
            resposta = resposta.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (c < " ") continue;
        resposta += c;
        process.stdout.write(oculto ? "*" : c);
      }
    }
    ignorarProximoLf = true;
    entrada.on("data", aoDigitar);
  });
}

export async function pedirSenhaNova() {
  const senha = await perguntar("Senha (mínimo 10 caracteres): ", { oculto: true });
  if (senha.length < 10 || Buffer.byteLength(senha) > 72) throw new Error("A senha precisa ter de 10 a 72 caracteres.");
  if ((await perguntar("Repita a senha: ", { oculto: true })) !== senha) throw new Error("As senhas não são iguais.");
  return senha;
}
