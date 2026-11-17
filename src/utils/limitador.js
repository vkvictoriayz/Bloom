export function criarLimitador({ janela, maximo }) {
  const registros = new Map();

  setInterval(() => {
    const agora = Date.now();
    for (const [chave, r] of registros) if (agora - r.inicio > janela) registros.delete(chave);
  }, janela).unref();

  return {
    bloqueado(chave) {
      const r = registros.get(chave);
      return Boolean(r && Date.now() - r.inicio <= janela && r.total >= maximo);
    },
    registrar(chave) {
      const agora = Date.now();
      const r = registros.get(chave);
      if (!r || agora - r.inicio > janela) registros.set(chave, { inicio: agora, total: 1 });
      else r.total += 1;
    },
    limpar(chave) {
      registros.delete(chave);
    },
    espera(chave) {
      const r = registros.get(chave);
      return r ? Math.max(1, Math.ceil((r.inicio + janela - Date.now()) / 1000)) : 0;
    },
  };
}

export function limitarPorIp(limitador, mensagem) {
  return (req, res, next) => {
    const chave = req.ip;
    if (limitador.bloqueado(chave)) {
      res.set("Retry-After", String(limitador.espera(chave)));
      return res.status(429).json({ erro: mensagem });
    }
    limitador.registrar(chave);
    next();
  };
}
