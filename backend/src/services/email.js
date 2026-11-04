// Envio de e-mails transacionais pelo Resend (https://resend.com/docs/api-reference/emails/send-email),
// por HTTP, sem dependências novas.
//
// Variáveis de ambiente:
//   RESEND_API_KEY  — chave da conta no Resend
//   EMAIL_REMETENTE — remetente de um domínio verificado no Resend, ex.: "Bloom <nao-responda@seudominio.com.br>"
//
// Sem elas nenhum e-mail sai. Em desenvolvimento (NODE_ENV diferente de
// "production") o conteúdo do e-mail é mostrado no terminal do servidor, para
// testar o fluxo; em produção só fica registrado que o envio não está configurado.

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
