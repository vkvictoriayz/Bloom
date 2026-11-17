# Bloom: o que está feito e o que falta

Checklist do projeto, por área. Marque `[x]` quando terminar algo e mova da
seção "Falta" para "Feito". Detalhes técnicos de cada área ficam nos outros
arquivos de `docs/`.

**Legenda**

- `[x]` feito e testado
- `[ ]` falta fazer (código)
- `[~]` o código está pronto, mas **depende de configuração externa** (chave,
  contrato, conta em serviço)

**Como rodar:** `npm run server` (API, porta 3001) e `npm run dev` (site, porta
3006). As migrations do banco rodam sozinhas quando a API inicia.

---

## Resumo

| Área | Telas | Backend | Falta (código) | Depende de configuração |
| --- | --- | --- | --- | --- |
| Candidata | 23 (+ confirmar e-mail) | completo | nada | CPF (Serpro), e-mails (Resend), Premium (Mercado Pago) |
| Empresa | 18 | completo | processo de verificar quem representa a empresa | e-mails (Resend), Premium (Mercado Pago) |
| Administrador | 7 (+ subtelas) | completo | nada | e-mails dos links de senha (Resend) |

---

## Área da candidata

Documentação: [area-candidata.md](area-candidata.md),
[rede-social.md](rede-social.md), [autenticacao.md](autenticacao.md).

### Páginas feitas

- [x] Home pública, cadastro, login, recuperar e redefinir senha
- [x] Confirmar e-mail (página aberta pelo link do e-mail)
- [x] Início (painel), feed, explorar
- [x] Vagas, detalhes da vaga, candidatar-se, vagas salvas
- [x] Candidaturas, detalhe e andamento da candidatura
- [x] Perfil, editar perfil, perfil de outra integrante
- [x] Projetos (lista e formulário)
- [x] Comunidades e detalhe da comunidade
- [x] Conexões (seguir), mensagens e conversa
- [x] Notificações, configurações, Premium
- [x] Perfil público de empresa

### Frontend

- [x] Todas as telas acima ligadas à API (sem dados fictícios)
- [x] Publicações com imagem, edição, comentários, curtidas
- [x] Feed com cara de rede social: coluna lateral (meu perfil com seguidoras/seguindo, "Complete seu perfil", assuntos em alta, comunidades para participar, quem seguir), saudação no campo de publicar, `#hashtags` clicáveis e aviso de "publicações novas" (confere a cada minuto)
- [x] Botão "Denunciar" em publicações, comentários, perfis, vagas, empresas e comunidades
- [x] Envio de currículo (PDF/DOC/DOCX até 5 MB)
- [x] Aviso "Confirme seu e-mail" no topo da área (com reenviar) e situação do e-mail em Configurações
- [x] Retirar candidatura (no detalhe da candidatura, com confirmação)
- [x] Lista de candidaturas com carregamento, erro e logo real da empresa
- [x] "Sobre a empresa" no detalhe da candidatura abre o perfil certo
- [x] Antiga tela `/contatos` (não enviava nada) virou atalho para Mensagens

### Backend

- [x] Login, cadastro, sessão (JWT), limites contra abuso
- [x] Recuperação de senha (token de uso único, 30 min) e troca de e-mail
- [x] Confirmação de e-mail (link de uso único, 24 h; trocar o e-mail pede nova confirmação)
- [x] Exclusão da própria conta e dos dados
- [x] Perfil, projetos, currículo, vagas, candidaturas com cópia do currículo
- [x] Retirar candidatura (Recebida, Em análise ou Em entrevista; apaga o envio e a conversa e avisa a empresa)
- [x] Rede social: feed, busca, seguir, comunidades, mensagens
- [x] Assuntos em alta (`GET /api/comunidade/em-alta`: hashtags dos últimos 14 dias)
- [x] Notificações com preferências por categoria
- [x] Denúncias (`/api/denuncias`)
- [x] Conteúdo de conta suspensa some para as outras pessoas

### APIs externas

- [x] BrasilAPI (CNPJ), gratuita e sem chave
- [~] Serpro Consulta CPF: preencher `SERPRO_CPF_*` (sem isso, o CPF fica "não verificado")
- [~] Resend (e-mails): preencher `RESEND_API_KEY` e `EMAIL_REMETENTE` (sem isso, em desenvolvimento o e-mail aparece no terminal da API)
- [~] Mercado Pago (Premium): preencher `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `API_PUBLIC_URL` (sem isso, nada é cobrado)

### O que falta

- Nada de código. Para usar:
  - [ ] Reiniciar a API para aplicar a migration 008 (confirmação de e-mail)
  - [~] Configurar o Resend para os e-mails de confirmação saírem de verdade

---

## Área da empresa

Documentação: [area-empresa-premium.md](area-empresa-premium.md).

### Páginas feitas

- [x] Cadastro com CNPJ e login de empresa
- [x] Dashboard
- [x] Vagas (lista, criar/editar, rascunho, detalhe)
- [x] Candidaturas e detalhe (etapas: Recebida → Em análise → Em entrevista → Aprovada/Reprovada)
- [x] Banco de talentos, explorar talentos, perfil da talento
- [x] Feed, publicações, criar publicação
- [x] Perfil, editar perfil, informações complementares
- [x] Notificações, configurações, Premium

### Frontend

- [x] Todas as telas acima ligadas à API
- [x] Download do currículo enviado na candidatura
- [x] Aviso "Confirme seu e-mail" e situação do e-mail em Configurações
- [x] Notificação quando uma candidata retira a candidatura

### Backend

- [x] `/api/empresa`: vagas, candidaturas, talentos, publicações, perfil
- [x] Consulta do CNPJ na BrasilAPI no cadastro
- [x] Bloom Premium (`/api/premium`) com Mercado Pago e webhook
- [x] Notificações e preferências

### APIs externas

- [x] BrasilAPI (CNPJ)
- [~] Mercado Pago: ver "Configuração manual" em [area-empresa-premium.md](area-empresa-premium.md)
- [~] Resend (e-mails)

### O que falta

- [ ] Definir o processo de verificar **quem representa** a empresa (por
  exemplo, e-mail no domínio do site da empresa ou envio de documento). Hoje a
  equipe confirma manualmente no painel do administrador, em Empresas.

---

## Área do administrador

Documentação: [administracao.md](administracao.md). Acesso em
http://localhost:3006/admin.

### Páginas feitas

- [x] Login do painel (com etapa do código de duas etapas)
- [x] Painel (números, gráfico de contas por dia, pendências, últimas ações)
- [x] Candidatas e empresas (lista, filtros, detalhe)
- [x] Vagas, publicações, comunidades (moderação)
- [x] Denúncias (fila com ações diretas)
- [x] Comunicados (só acesso total)
- [x] Pagamentos, registro de ações, administradores
- [x] Minha conta (troca de senha e verificação em duas etapas)

### Frontend

- [x] Menu por nível de acesso (`super` e `moderador`)
- [x] Toda ação que afeta uma conta pede motivo
- [x] Botão "Exportar planilha" (CSV) em candidatas, empresas, vagas, denúncias, pagamentos e registro
- [x] Troca obrigatória da senha inicial antes de usar o painel

### Backend

- [x] Login próprio, token de 4 h, conferência no banco a cada requisição
- [x] Verificação em duas etapas (app autenticador + 8 códigos de recuperação)
- [x] Suspender, reativar, excluir contas; confirmar representante de empresa
- [x] Enviar link de nova senha para uma conta
- [x] Moderar vagas, publicações, comentários, comunidades
- [x] Denúncias: listar, resolver, descartar (fecham sozinhas ao remover o conteúdo)
- [x] Comunicados para todas as contas, só candidatas ou só empresas
- [x] Relatórios CSV (CPF mascarado, proteção contra fórmulas no Excel)
- [x] Registro de todas as ações (`LOGS_ADMIN`)
- [x] Comandos no terminal: `npm run admin:criar` e `npm run admin:senha`

### O que falta

- Nada de código. Para usar:
  - [ ] Reiniciar a API para aplicar a migration 007
  - [ ] Trocar a senha do seu administrador (`npm run admin:senha`)
  - [ ] Ligar a verificação em duas etapas em **Minha conta** (recomendado)

---

## Antes de publicar (produção)

- [ ] Preencher as variáveis do `.env` de produção (`JWT_SECRET` forte, banco, `FRONTEND_URL`)
- [ ] Contratar o Serpro (CPF) e configurar
- [ ] Criar conta no Resend, verificar o domínio e configurar
- [ ] Trocar o token de teste do Mercado Pago pelo de produção e cadastrar o webhook
- [ ] Definir a verificação de representante de empresa
- [x] Implementar a verificação de e-mail no cadastro (falta só o Resend, acima)
