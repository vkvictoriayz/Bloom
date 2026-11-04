# Área da empresa, notificações e Bloom Premium

Rotas, tabelas e regras da área da empresa, das preferências de notificação e
do Bloom Premium (candidatas e empresas). Login e cadastro estão em
[autenticacao.md](autenticacao.md); a área da candidata, em
[area-candidata.md](area-candidata.md).

## Migrations

Ficam em `backend/migrations/` e rodam sozinhas quando a API inicia
(`backend/src/migracoes.js`). Cada arquivo roda uma vez só; o controle fica
na tabela `SCHEMA_MIGRACAO`. Elas só acrescentam colunas, valores e tabelas:
nenhum dado existente é apagado.

| Arquivo | O que faz |
| --- | --- |
| `001_area_empresa.sql` | `CANDIDATURAS.status` passa a ser Recebida, Em análise, Em entrevista, Aprovada, Reprovada (as "Pendente" viram "Recebida"); `VAGAS.status` ganha "Rascunho", `data_publicacao` aceita vazio (rascunho) e entram `nivel`, `beneficios`, `salario_max`; `PERFIL_EMPRESA` ganha `area_atuacao`, `linkedin`, `email_contato`, `informacoes`. |
| `002_notificacoes_premium.sql` | Cria `PREFERENCIA_NOTIFICACAO`, `CONVITE`, `PLANO`, `ASSINATURA`, `CAMPANHA`, `PAGAMENTO` e cadastra os planos (Premium empresa R$ 99,90/mês, Premium candidata R$ 99,90/mês, Publicidade R$ 150,00 por campanha). |

## Preferências de notificação

`GET /api/notificacoes/preferencias` e `PUT /api/notificacoes/preferencias`
(candidata ou empresa). Sem registro, tudo vem ligado. O serviço
`notificar()` consulta a preferência antes de criar cada notificação.

| Conta | Categorias |
| --- | --- |
| Candidata | `vagasCompativeis`, `candidaturas`, `mensagens`, `convites`, `comunidade`, `plataforma` |
| Empresa | `candidaturas`, `mensagens`, `plataforma` |

"Vaga compatível": ao publicar uma vaga, avisa candidatas cujas competências
aparecem no texto da vaga ou cuja área de interesse é a área da vaga.

## Área da empresa (`/api/empresa`, login de empresa)

| Rota | O que faz |
| --- | --- |
| `GET /perfil` · `PUT /perfil` | Perfil: nome, telefone, logo, descrição, área de atuação, localização, site, LinkedIn (precisa ser linkedin.com), e-mail de contato, informações adicionais (até 1000). |
| `GET /vagas?status=` · `POST /vagas` | Lista (com candidaturas e "interessadas" = quem salvou) e cria. `rascunho: true` salva sem publicar. |
| `GET /vagas/:id` · `PUT /vagas/:id` | Detalhe (com contagem por etapa) e edição. |
| `PATCH /vagas/:id/status` | Rascunho → Aberta (publicar); Aberta ↔ Pausada (desativar/reativar); Encerrada. Vaga com candidaturas não volta a rascunho. |
| `DELETE /vagas/:id` | Só vagas sem candidaturas (as outras: encerrar). |
| `GET /dashboard` | Números reais: vagas por status, candidaturas por etapa, recentes. |
| `GET /candidaturas` · `GET /candidaturas/:id` · `PATCH /candidaturas/:id/status` | Gestão de candidaturas; a candidata é notificada a cada mudança de etapa. |
| `GET /talentos` · `GET /talentos/:id` | Banco de talentos (respeita a privacidade; Premium primeiro). |
| `POST /talentos/:id/convites` | `{ vagaId, mensagem? }` convida para uma vaga aberta (uma vez por vaga). |

Públicas para candidatas: `GET /api/vagas` (empresas Premium primeiro, com
destaque), `GET /api/vagas/:id`, `GET /api/vagas/empresas/:id` (perfil
público da empresa e vagas abertas).

## Bloom Premium (`/api/premium`, candidata ou empresa)

| Rota | O que faz |
| --- | --- |
| `GET /` | Planos da conta, assinatura atual, histórico de pagamentos e campanhas; `pagamentosConfigurados` diz se o Mercado Pago está ligado. |
| `POST /assinatura` | `{ plano: "premium_candidata" | "premium_empresa" }` cria a assinatura no Mercado Pago e devolve `initPoint` (página de pagamento). |
| `POST /assinatura/sincronizar` | Relê o status no Mercado Pago (usado na volta do pagamento). |
| `DELETE /assinatura` | Cancela no Mercado Pago; só marca como cancelada se ele confirmar. |
| `POST /campanhas` | Só empresa: `{ titulo, texto, link? }` cria a campanha e o checkout (R$ 150,00). |
| `POST /campanhas/:id/sincronizar` · `DELETE /campanhas/:id` | Confere o pagamento · desiste de campanha não paga. |

`POST /api/pagamentos/mercadopago/webhook` (público): confere a assinatura
`x-signature` com `MP_WEBHOOK_SECRET` e sempre relê o pagamento/assinatura
na API do Mercado Pago. Nada vira "ativo" ou "pago" sem essa confirmação.

O que o Premium muda hoje: vagas de empresas Premium aparecem primeiro com o
selo "Destaque"; candidatas Premium aparecem primeiro no banco de talentos;
selo Premium no perfil. Conta com assinatura ativa/pendente não pode ser
excluída antes de cancelar. Assinaturas e pagamentos ficam guardados após a
exclusão da conta (registro financeiro).

## Configuração manual

1. Criar a aplicação no Mercado Pago e copiar o Access Token **de teste**
   para `MP_ACCESS_TOKEN` no `.env` (depois, o de produção).
2. Cadastrar o webhook em Suas integrações > Webhooks com a URL
   `https://<sua-api>/api/pagamentos/mercadopago/webhook`, eventos
   "Pagamentos" e "Planos e assinaturas"; copiar a assinatura secreta para
   `MP_WEBHOOK_SECRET` e o endereço da API para `API_PUBLIC_URL`.
3. Conferir `FRONTEND_URL` (página de volta depois do pagamento).
4. Reiniciar a API (`npm run server`): as migrations rodam na inicialização.
