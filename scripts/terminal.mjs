// Leitura do teclado para os comandos de administração (admin:criar, admin:senha).
// Um único leitor, em modo "raw": nada mais escuta a entrada ao mesmo tempo,
// então a senha nunca aparece na tela (só "*") e nenhuma pergunta é pulada.

const ENTER = new Set(["\r", "\n"]);

export function exigirTerminal() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    console.error("Rode este comando num terminal interativo (as respostas são digitadas na hora).");
    process.exit(1);
  }
}

// Pergunta e espera o Enter. Com "oculto", mostra * no lugar de cada caractere.
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
        // Windows manda "\r\n" no Enter: o "\n" que sobra não vale como resposta vazia.
        if (c === "\n" && ignorarProximoLf) {
          ignorarProximoLf = false;
          continue;
        }
        ignorarProximoLf = false;
        if (ENTER.has(c)) {
          if (!resposta && !oculto && !permitirVazio) continue; // Enter sem nada: continua esperando
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
        if (c < " ") continue; // outras teclas de controle (setas etc.)
        resposta += c;
        process.stdout.write(oculto ? "*" : c);
      }
    }
    // Descarta o que ficou no buffer da pergunta anterior (ex.: o "\n" do Enter).
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
