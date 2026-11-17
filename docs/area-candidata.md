# Área da candidata: API e banco

O que a área da candidata guarda no servidor, as rotas e as regras. Login e
cadastro estão em [autenticacao.md](autenticacao.md).

## O que mudou

- Perfil profissional, projetos e vagas salvas saíram do navegador e passaram
  a ficar na conta. O navegador guarda só uma cópia (cache) para as telas
  lerem na hora; ao abrir a área, a cópia é atualizada pelo servidor.
- Na primeira vez que a candidata abre a área depois da mudança, se a conta
  ainda está vazia e o navegador tem um perfil das versões antigas, esse
  perfil é enviado para a conta (o resumo é cortado em 500 caracteres, o
  limite do banco).
- As vagas de exemplo (fixas no código) saíram da área da candidata: só
  aparecem vagas publicadas por empresas. As candidaturas a vagas de exemplo,
  que ficavam só no navegador, foram apagadas.
- Notificações, mensagens com empresas e troca de senha passaram a funcionar.

## Tabelas

Do `banco bloom.sql`, usadas como estão (nada alterado):

| Tabela | Uso |
| --- | --- |
| `PERFIL_USUARIA` | localização e resumo (`descricao`, 500 caracteres) |
| `EXPERIENCIA` | experiências (cargo, empresa, período, descrição de 250) |
| `FORMACAO` | formação (curso, instituição, nível, período) |
| `HABILIDADE` + `PERFIL_HABILIDADE` | competências técnicas (catálogo compartilhado) |
| `FAVORITOS` | vagas salvas |
| `CADASTRO_USUARIA` | nome e telefone |

Novas (criadas na primeira execução do servidor):

| Tabela | Uso |
| --- | --- |
| `PERFIL_CANDIDATA_DETALHES` | título, objetivo, links, preferências, competências comportamentais e cursos |
| `PROJETO_CANDIDATA` | projetos do portfólio (imagem de até 400 KB) |
| `NOTIFICACAO` | avisos para candidatas e empresas |
| `CONVERSA` | conversa entre candidata e empresa, ligada a uma candidatura |
| `MENSAGEM` | mensagens de cada conversa |
| `COMUNIDADE` | comunidades temáticas (nome único, tema, descrição, quem criou) |
| `COMUNIDADE_MEMBRO` | participantes de cada comunidade |
| `COMUNIDADE_PUBLICACAO` | liga uma publicação (tabela `PUBLICACAO`) à comunidade |

Também do banco original, sem alteração: `CONFIG_USUARIA` guarda a
privacidade (`perfil_publico`, `mostrar_experiencia`, `mostrar_contato`).

## Rotas

Todas exigem login. As da candidata aceitam só contas `usuaria`; as de
notificações, mensagens e senha valem para candidatas e empresas. Cada rota só
lê e altera dados da própria conta.

| Método | Rota | Para quê |
| --- | --- | --- |
| GET | `/api/candidata/perfil` | Perfil completo (com projetos) |
| PUT | `/api/candidata/perfil` | Salva só as seções enviadas (`nome, telefone, cargo, local, links` / `sobre, objetivo` / `tecnicas, comportamentais` / `experiencias` / `formacoes` / `cursos` / `preferencias`) |
| GET/POST | `/api/candidata/projetos` | Lista / cria projeto |
| PUT/DELETE | `/api/candidata/projetos/:id` | Edita / exclui projeto |
| GET | `/api/candidata/salvas` | Ids das vagas salvas |
| PUT/DELETE | `/api/candidata/salvas/:vagaId` | Salva / remove vaga |
| GET | `/api/notificacoes` | Últimas 50 e total de não lidas (`?resumo=1`: só o total) |
| POST | `/api/notificacoes/:id/lida` | Marca uma como lida |
| POST | `/api/notificacoes/lidas` | Marca todas |
| GET | `/api/mensagens` | Conversas, com última mensagem e não lidas |
| POST | `/api/mensagens` | `{ candidaturaId }` abre ou retoma a conversa da candidatura |
| GET | `/api/mensagens/:id` | Mensagens da conversa (marca as recebidas como lidas) |
| POST | `/api/mensagens/:id` | `{ texto }` envia (até 1000 caracteres) |
| DELETE | `/api/candidaturas/:id` | Retira a candidatura (só Recebida, Em análise ou Em entrevista). Apaga a apresentação, a cópia do currículo e a conversa com a empresa, e avisa a empresa. Depois dá para se candidatar de novo se a vaga estiver aberta. |
| PUT | `/api/auth/senha` | `{ senhaAtual, novaSenha, confirmarSenha }` troca a senha |
| POST | `/api/auth/email/reenviar` | Manda outro link para confirmar o e-mail (ver [autenticacao.md](autenticacao.md)) |
| DELETE | `/api/auth/conta` | `{ senha, confirmacao: "EXCLUIR" }` exclui a conta e todos os dados |
| GET/PUT | `/api/candidata/privacidade` | `{ perfilPublico, mostrarExperiencia, mostrarContato }` |
| GET | `/api/comunidades` | Lista (candidatas e empresas) |
| POST | `/api/comunidades` | `{ nome, tema, descricao }` cria (só candidatas; até 5 por pessoa) |
| GET | `/api/comunidades/:id` | Dados, participantes e publicações |
| DELETE | `/api/comunidades/:id` | Exclui (só quem criou) |
| POST | `/api/comunidades/:id/participar` | Entra ou sai |
| POST | `/api/comunidades/:id/publicacoes` | `{ texto, tipo }` publica (só participantes) |

As rotas de perfil e projetos têm limite de corpo próprio (100 kB e 700 kB);
o resto da API continua com 20 kB.

## Regras

- **Quem vê o perfil profissional:** só a empresa que recebeu uma candidatura
  da candidata, na página da candidatura (`GET /api/empresa/candidaturas/:id`).
  O telefone não vai junto. Os dados públicos da comunidade (nome, foto, área,
  interesses, apresentação) continuam visíveis para quem está logado.
- **Mensagens:** só existem entre uma candidata e uma empresa que têm uma
  candidatura em comum. Qualquer uma das duas abre a conversa pela página da
  candidatura. Não há tempo real: a conversa aberta consulta o servidor a cada
  15 segundos.
- **Notificações geradas:**
  - candidata: mudança de status da candidatura, nova seguidora, curtida e
    comentário nas publicações dela, mensagem nova;
  - empresa: nova candidatura, mensagem nova.
  Curtidas e comentários de uma mesma publicação, e mensagens de uma mesma
  conversa, viram um aviso só até ele ser lido. O sino do topo mostra quantas
  não foram lidas (consulta a cada minuto e ao trocar de página).
- **Troca de senha:** confere a senha atual; 5 tentativas erradas bloqueiam por
  15 minutos.
- **Comunidades:** criadas por candidatas; empresas só leem. Quem criou não sai
  (exclui a comunidade). Ao excluir, as publicações continuam no feed, sem o
  vínculo com a comunidade.
- **Privacidade** (padrão: perfil visível, perfil profissional e e-mail
  escondidos):
  - perfil escondido: some da busca de talentos, do banco de talentos, das
    sugestões de pessoas e das listas de participantes; as publicações
    continuam no feed;
  - mostrar perfil profissional: a empresa vê resumo, experiência, formação,
    competências e projetos no perfil da candidata, mesmo sem candidatura;
  - mostrar e-mail: a empresa vê o e-mail no perfil. O telefone nunca aparece.
  Ao se candidatar, a empresa daquela vaga sempre recebe o e-mail e o perfil
  profissional.
- **Exclusão de conta** (candidata ou empresa): pede a senha e a palavra
  EXCLUIR, e apaga tudo numa transação só (`src/services/exclusaoConta.js`).
  - candidata: cadastro, perfil, projetos, imagens, candidaturas, vagas salvas,
    publicações (e as curtidas e comentários nelas), comentários e curtidas
    dela, conexões, mensagens, notificações, privacidade e as comunidades que
    ela criou;
  - empresa: cadastro, perfil, imagens, vagas, candidaturas recebidas, vagas
    salvas que apontavam para elas, publicações, mensagens e notificações. As
    candidatas afetadas recebem um aviso.

## Ainda não existe

Os itens que estavam aqui (currículo, preferências de notificação, troca de
e-mail) já foram feitos. O que falta está em [STATUS.md](STATUS.md).

## Currículo, busca, projetos e e-mail (migration 004)

`src/database/migrations/004_curriculo.sql` cria `CURRICULO_CANDIDATA` (o
arquivo do perfil, um por candidata) e `CANDIDATURA_CURRICULO` (a cópia
enviada com cada candidatura, para a empresa ver a versão daquele momento).
Os arquivos ficam no banco (MEDIUMBLOB): PDF, DOC ou DOCX até 5 MB, com o tipo
conferido pelos primeiros bytes.

| Rota | O que faz |
| --- | --- |
| `GET /api/candidata/curriculo` | Nome, tamanho e data do currículo (ou `null`). |
| `PUT /api/candidata/curriculo` | `{ nome, arquivo }` (base64). Envia ou troca. |
| `GET /api/candidata/curriculo/arquivo` | Baixa o próprio currículo. |
| `DELETE /api/candidata/curriculo` | Tira do perfil (as cópias das candidaturas continuam). |
| `POST /api/candidaturas` | `incluirCurriculo: true` anexa uma cópia do currículo do perfil. |
| `GET /api/empresa/candidaturas/:id/curriculo` | Só a empresa dona da vaga baixa o anexo. |
| `GET /api/comunidade/feed?busca=` | Busca no texto das publicações. |
| `GET /api/comunidade/projetos?busca=&autora=` | Projetos de integrantes com perfil público (nome, descrição, tecnologias). |
| `PUT /api/auth/email` | `{ email, senha }`: troca o e-mail de login (candidata ou empresa). |

## Como rodar em desenvolvimento

`npm run server` (API, porta 3001) e `npm run dev` (front, porta 3006), em
terminais separados. O `.env` usa `FRONTEND_URL=http://localhost:3006`.
