# Área de administração

Painel da equipe da Bloom em `/admin` (front) e `/api/admin` (API). Usa as
tabelas `ADMINS`, `LOGS_ADMIN` e `DASHBOARD_ADMIN` do `banco bloom.sql`.

## Primeiro acesso

Não existe cadastro público de administrador. Crie o primeiro pelo terminal,
na raiz do projeto:

```bash
npm run admin:criar
```

O comando pede nome, usuário, e-mail e senha (mínimo de 10 caracteres; ela não
aparece na tela) e cria um administrador com **acesso total**. Depois, entre em
http://localhost:3006/admin. Os demais administradores são criados no próprio
painel, em **Administradores**.

## Níveis de acesso

| Nível | Pode |
| --- | --- |
| `super` (acesso total) | Tudo da moderação, mais excluir contas e criar, promover ou desativar administradores |
| `moderador` | Painel, contas (ver, suspender, reativar, confirmar representante), moderação de vagas, publicações, comentários e comunidades, pagamentos (leitura) e registro |

Sempre fica pelo menos um administrador `super` ativo, e ninguém muda o próprio
acesso.

## O que o painel faz

- **Painel**: números reais (candidatas, empresas, vagas, candidaturas por
  etapa, publicações, comunidades, Premium), pendências e últimas ações. Uma
  foto diária dos totais fica em `DASHBOARD_ADMIN` (gravada ao iniciar a API, a
  cada 6 horas e ao abrir o painel) e alimenta o gráfico de contas por dia.
- **Candidatas e empresas**: busca, filtros (ativas, suspensas, representante
  pendente) e detalhe. O CPF aparece mascarado.
  - **Suspender** (com motivo): bloqueia o login e corta as sessões abertas em
    até 10 segundos. A candidata some de buscas, listas e perfis públicos. A
    empresa tem as vagas abertas pausadas e o perfil público ocultado.
  - **Reativar**: devolve o acesso e avisa a conta.
  - **Excluir** (só `super`, com motivo e a palavra EXCLUIR): apaga a conta e os
    dados, como a exclusão feita pela própria pessoa. Contas com assinatura
    Premium em aberto precisam ter a assinatura cancelada antes.
  - **Confirmar representante** da empresa, depois de conferir o vínculo por um
    canal oficial (a consulta do CNPJ confirma a empresa, não a pessoa).
- **Vagas**: pausar ou encerrar uma vaga, com motivo; a empresa é avisada.
- **Publicações, comentários e comunidades**: remover com motivo; quem publicou
  é avisado. Remover uma comunidade mantém as publicações no feed.
- **Pagamentos**: assinaturas e pagamentos do Mercado Pago (só leitura).
- **Registro de ações**: tudo o que a equipe fez, com quem, quando e o motivo
  (`LOGS_ADMIN`).

## Segurança

- Login próprio (`POST /api/admin/login`), por usuário ou e-mail, com limite de
  tentativas e a mesma resposta para usuário inexistente e senha errada.
- Token com `tipo: "admin"`, válido por 4 horas. A cada requisição a API confere
  no banco se o administrador continua ativo.
- O token de administrador não é aceito nas rotas de candidatas e empresas
  (e o contrário também).
- Senhas com bcrypt (12 rodadas).
- Toda ação que muda algo exige motivo (quando afeta uma conta) e fica no
  registro.

## Migration 005 (`src/database/migrations/005_admin.sql`)

Cria `ADMINS`, `LOGS_ADMIN` e `DASHBOARD_ADMIN` se não existirem e acrescenta:

| Tabela | Colunas novas |
| --- | --- |
| `ADMINS` | `ativo`, `ultimo_acesso` |
| `LOGS_ADMIN` | `detalhes` |
| `CADASTRO_USUARIA`, `CADASTRO_EMPRESA` | `suspensa_em`, `motivo_suspensao` |

## Rotas (`/api/admin`)

| Rota | Quem |
| --- | --- |
| `POST /login`, `GET /me`, `PUT /senha`, `GET /dashboard` | administradores |
| `GET /candidatas`, `GET /candidatas/:id`, `GET /empresas`, `GET /empresas/:id` | administradores |
| `POST /candidatas/:id/suspender`, `POST /candidatas/:id/reativar` (idem `/empresas/:id/...`) | administradores |
| `PATCH /empresas/:id/representante` | administradores |
| `DELETE /candidatas/:id`, `DELETE /empresas/:id` | só `super` |
| `GET /vagas`, `PATCH /vagas/:id/status` | administradores |
| `GET /publicacoes`, `GET /publicacoes/:id/comentarios`, `DELETE /publicacoes/:id`, `DELETE /publicacoes-empresa/:id`, `DELETE /comentarios/:id` | administradores |
| `GET /comunidades`, `DELETE /comunidades/:id` | administradores |
| `GET /pagamentos`, `GET /registro` | administradores |
| `GET /admins`, `POST /admins`, `PATCH /admins/:id` | só `super` |
