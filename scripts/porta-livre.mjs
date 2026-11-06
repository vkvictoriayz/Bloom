// Roda antes do "npm run dev" (predev): confere se a porta do front está
// livre e, se não estiver, explica o motivo em vez de mostrar o erro do Vite.
import { connect } from "node:net";

const PORTA = 3006;

// Alguém já atende nessa porta? (o Vite escuta em localhost: ::1 ou 127.0.0.1)
const atende = (host) =>
  new Promise((ok) => {
    const s = connect({ host, port: PORTA });
    s.setTimeout(800);
    s.once("connect", () => (s.destroy(), ok(true)));
    s.once("timeout", () => (s.destroy(), ok(false)));
    s.once("error", () => ok(false));
  });

if ((await atende("::1")) || (await atende("127.0.0.1"))) {
  // Já é o front da Bloom? Então basta usar o que está aberto.
  const bloom = await fetch(`http://localhost:${PORTA}/`, { signal: AbortSignal.timeout(1500) })
    .then(async (r) => (await r.text()).includes("/src/views/main.jsx"))
    .catch(() => false);
  console.error(
    bloom
      ? `\n  O front da Bloom já está rodando em http://localhost:${PORTA} (em outro terminal).\n  Use esse endereço, ou feche o outro terminal (Ctrl+C) e rode "npm run dev" de novo.\n`
      : `\n  A porta ${PORTA} está em uso por outro programa.\n  Feche esse programa e rode "npm run dev" de novo.\n`
  );
  process.exit(1);
}
