export function emailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);
}

export async function enviarEmail({ para, assunto, html, texto }) {
  if (!emailConfigurado()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[e-mail não configurado — só em desenvolvimento] ${assunto}\n${texto}\n`);
    } else {
      console.warn("E-mail não enviado: configure RESEND_API_KEY e EMAIL_REMETENTE.");
    }
    return false;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_REMETENTE, to: [para], subject: assunto, html, text: texto }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resposta.ok) {
      console.error("Falha ao enviar e-mail: HTTP", resposta.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Falha ao enviar e-mail:", e.message);
    return false;
  }
}
