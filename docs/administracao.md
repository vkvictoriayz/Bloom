# Área de administração

Painel da equipe da Bloom em `/admin` (front) e `/api/admin` (API). Usa as
tabelas `ADMINS`, `LOGS_ADMIN` e `DASHBOARD_ADMIN` do `banco bloom.sql`.

## Primeiro acesso

Não existe cadastro público de administrador. Crie o primeiro pelo terminal,
na raiz do projeto:

```bash
npm run admin:criar
```

O comando pede nome, usuário, e-mail e senha (mínimo de 10 caracteres; na tela
aparece só `*`) e cria um administrador com **acesso total**. Depois, entre em
http://localhost:3006/admin. Os demais administradores são criados no próprio
painel, em **Administradores**.

### Esqueci a senha do painel

```bash
npm run admin:senha
```

Pede o usuário (ou e-mail) do administrador e a senha nova (que aparece só como
`*`). Se o administrador estiver desativado, ele é reativado. A ação fica no
registro do painel. Só quem tem acesso ao servidor e ao `.env` consegue rodar.

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
- **Ajuda com senha**: em cada conta, "Enviar link para criar nova senha" manda o
  mesmo link do "esqueci minha senha" (vale 30 minutos). A equipe nunca vê nem
  define a senha de ninguém.
- **Vagas**: pausar ou encerrar uma vaga, com motivo; a empresa é avisada.
- **Publicações, comentários e comunidades**: remover com motivo; quem publicou
  é avisado. Remover uma comunidade mantém as publicações no feed.
- **Denúncias**: candidatas e empresas denunciam publicações, comentários,
  perfis, empresas, vagas e comunidades (motivo + explicação opcional; uma por
  pessoa e item; até 20 por hora). A fila mostra o conteúdo denunciado, quem
  publicou, quantas denúncias o item tem e ações diretas (remover, encerrar a
  vaga, abrir a conta para suspender). Remover o conteúdo ou suspender a conta
  fecha as denúncias daquele item sozinho; também dá para resolver ou descartar
  com uma explicação. Quem denunciou recebe um aviso, sem saber o que foi
  decidido em detalhe, e quem foi denunciado não sabe quem denunciou.
- **Pagamentos**: assinaturas e pagamentos do Mercado Pago (só leitura).
- **Registro de ações**: tudo o que a equipe fez, com quem, quando e o motivo
  (`LOGS_ADMIN`).

## Conta suspensa

Enquanto a conta está suspensa, além de perder o acesso, o conteúdo dela some
para as outras pessoas: publicações do feed e das comunidades, comentários (e a
contagem deles), publicações de empresa no feed das empresas, perfil público e
listas. Tudo volta ao reativar.

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

## Migration 006 (`src/database/migrations/006_denuncias.sql`)

Cria a tabela `DENUNCIA` (quem denunciou, o alvo, motivo, explicação, situação
`aberta`/`resolvida`/`descartada`, quem decidiu e quando). Uma denúncia por
pessoa e item (índice único).

## Denúncias (`/api/denuncias`, candidatas e empresas)

| Rota | O que faz |
| --- | --- |
| `GET /motivos` | Motivos aceitos |
| `POST /` | `{ alvoTipo, alvoId, motivo, descricao? }`. `alvoTipo`: `publicacao`, `publicacao_empresa`, `comentario`, `perfil`, `empresa`, `vaga`, `comunidade` |

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
| `POST /candidatas/:id/redefinicao-senha`, `POST /empresas/:id/redefinicao-senha` | administradores |
| `GET /denuncias?status=`, `PATCH /denuncias/:id` | administradores |
| `GET /pagamentos`, `GET /registro` | administradores |
| `GET /admins`, `POST /admins`, `PATCH /admins/:id` | só `super` |
