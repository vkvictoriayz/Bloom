# Rede social: imagens, edição, mensagens, ícones e seguir

Recursos de networking da área da candidata. Comunidade (feed) e comunidades
temáticas estão em [area-candidata.md](area-candidata.md).

## Migration 003 (`src/database/migrations/003_rede_social.sql`)

Aplicada sozinha quando a API inicia. Só acrescenta tabelas e colunas.

| Mudança | Para quê |
| --- | --- |
| `PUBLICACAO.editada_em` | marca "editada" nas publicações |
| `PUBLICACAO_IMAGEM` (1 por publicação, `ON DELETE CASCADE`) | imagem opcional das publicações (feed e comunidades), guardada no banco como as fotos de perfil |
| `ICONE_PERFIL` (`dono_tipo`, `dono_id`, `icone`) | ícone predefinido no lugar da foto (candidatas e empresas) |
| `COMUNIDADE.icone` | ícone da comunidade |
| `CONVERSA_DIRETA` (par único `id_usuaria_a < id_usuaria_b`) e `MENSAGEM_DIRETA` | conversas entre candidatas, separadas de `CONVERSA`/`MENSAGEM` (empresas) |

Seguir usa a tabela `CONEXAO`, que já existia (índice único seguidora/seguida).

## Migration 009 (`src/database/migrations/009_comunidade_mensagens.sql`)

| Tabela / coluna | Para quê |
| --- | --- |
| `COMUNIDADE.regras` | regras escritas por quem criou (até 1000 caracteres) |
| `COMUNIDADE_CAPA` (1 por comunidade) | capa da comunidade, guardada no banco e servida por `/api/imagens/<chave>` |
| `MENSAGEM_DIRETA.apagada_em` | mensagem apagada por quem enviou (o texto sai do banco) |

## APIs

Todas exigem login; as permissões são conferidas no servidor.

### Publicações (`/api/comunidade`, só candidatas)

| Rota | O que faz |
| --- | --- |
| `POST /publicacoes` | `{ texto, tipo, imagem?, largura?, altura? }`. Texto ou imagem (ou os dois). Imagem: data URL JPG/PNG/WebP, até 2 MB, conferida pelos primeiros bytes. |
| `PUT /publicacoes/:id` | Só a autora. `imagem`: data URL troca, `null` remove, ausente mantém. |
| `DELETE /publicacoes/:id` | Só a autora (apaga imagem, comentários, curtidas e o vínculo com a comunidade). |
| `DELETE /comentarios/:id` | Quem escreveu o comentário ou a autora da publicação. Devolve o novo total. |
| `GET /publicacoes/:id/comentarios` | Cada comentário traz `podeExcluir`. |
| `GET /feed?autora=<id>` | Publicações de uma integrante (perfil oculto: 404, menos para ela). |
| `GET /em-alta` | Até 6 `#hashtags` mais usadas nas publicações dos últimos 14 dias: `{ assuntos: [{ tag, publicacoes }] }`. Cada publicação conta uma vez por assunto, sem diferenciar maiúsculas; contas suspensas não entram; `#` dentro de links não conta. |

As imagens são servidas por `GET /api/imagens/<chave>` (chave aleatória nova a cada envio).

### Seguir (`/api/comunidade`)

| Rota | O que faz |
| --- | --- |
| `GET /perfis/:id` | Perfil, números (publicações, seguidoras, seguindo), `seguindo`, `segueVoce`, `souEu`. |
| `GET /perfis/:id/seguidoras` · `GET /perfis/:id/seguindo` | Listas, sem perfis ocultos. |
| `PUT /perfis/:id/seguir` · `DELETE /perfis/:id/seguir` | Segue / deixa de seguir (idempotentes; ninguém segue a si mesma; sem duplicar). `POST` continua alternando. |

### Mensagens entre candidatas (`/api/mensagens/candidatas`)

| Rota | O que faz |
| --- | --- |
| `GET /` | Conversas: outra participante (com a área), prévia, `ultimaEm`, `ultimaMinha`/`ultimaLida` (para os "✓✓") e não lidas. |
| `POST /` | `{ usuariaId }` abre ou reabre a conversa do par. Perfil oculto não recebe conversa nova. |
| `GET /:id` | As 50 mais recentes e `temMais`. `?antes=<id>`: 50 anteriores. `?depois=<id>`: só as novas (a tela consulta a cada 5 s). Marca como lidas as recebidas e devolve `lidasAte` (até qual mensagem minha a outra leu, para o "Visto"). Só as duas participantes. |
| `POST /:id` | `{ texto }` (até 1000). Avisa a outra pela notificação "mensagem" (respeita a preferência). |
| `DELETE /:id/mensagens/:mensagemId` | Quem enviou apaga a própria mensagem: o texto sai do banco e as duas veem "mensagem apagada". |

As conversas com empresas (`/api/mensagens`) também aceitam `?depois=<id>` e
devolvem `lidasAte` e `ultimaEm`/`ultimaMinha`/`ultimaLida` na lista.

### Comunidades (`/api/comunidades`)

| Rota | O que faz |
| --- | --- |
| `GET /?filtro=minhas\|descobrir&busca=` | Lista com `capa`, `regras`, `publicacoesSemana`, `ultimaAtividade` e `amostra` (até 4 participantes visíveis, para as fotos do cartão). As mais movimentadas primeiro. |
| `GET /:id?pagina=` | Comunidade, `criadora`, participantes (com `entrouEm`; sem perfis ocultos nem contas suspensas) e publicações, 20 por página, com `temMais`. |
| `PUT /:id` | Só quem criou: `icone`, `tema`, `descricao`, `regras` (o que não vier não muda). |
| `PUT /:id/capa` · `DELETE /:id/capa` | Só quem criou. `{ imagem }` data URL JPG/PNG/WebP até 1 MB (a tela reduz antes). |
| `DELETE /:id/publicacoes/:publicacaoId` | Quem criou tira uma publicação da comunidade (moderação). Ela continua no feed e no perfil de quem publicou. |
| `POST /:id/participar` | Entra ou sai. Quem criou recebe a notificação "X entrou na comunidade" (categoria Comunidade). |

As conversas com empresas continuam em `/api/mensagens` (sem mudança).

### Ícones

| Rota | O que faz |
| --- | --- |
| `PUT /api/imagens/icone` | `{ icone: "icone:<nome>:<cor>" }` no lugar da foto (a foto enviada sai). Enviar uma foto depois remove o ícone. |
| `DELETE /api/imagens/icone` | Volta às iniciais (empresas: ao logo informado). |
| `POST /api/comunidades` · `PUT /api/comunidades/:id` | `icone` opcional; só a criadora troca. |

A lista aceita está em `src/services/icones.js`. As cores e os desenhos ficam no
front, em `src/views/data/icones.js` e `src/views/components/Icone.jsx`.

## Telas

- **Comunidades** (`/candidata/comunidades`): abas **Descobrir** e **Minhas
  comunidades**, busca por nome ou tema e cartões com capa, ícone, tema, fotos
  de quem participa, número de participantes, atividade da semana e botão
  **Participar** direto no cartão.
- **Página da comunidade** (`/comunidades/:id`): capa (quem criou troca ou
  remove), ícone, nome, tema, participantes e atividade; abas **Publicações**
  (caixa de publicar, "Ver mais"; quem criou tem "Tirar da comunidade" no menu
  das publicações), **Participantes** (busca, selo "Criadora", desde quando) e
  **Sobre** (descrição, regras numeradas, criada em/por; quem criou edita,
  troca o ícone e exclui). Coluna lateral com o resumo e quem participa.
- **Mensagens** (`/candidata/mensagens` e `/empresa/mensagens`): duas colunas,
  como num app de conversa. À esquerda, busca, abas Candidatas/Empresas (só
  candidata), lista com foto, prévia, hora, "✓✓" e não lidas; o lápis abre
  "Nova conversa". À direita, a conversa: balões agrupados, separador de dia
  ("Hoje", "Ontem"…), "✓"/"✓✓", "Visto", apagar a própria mensagem (entre
  candidatas), "Carregar mensagens anteriores", mensagens novas chegando a cada
  5 s e Enter para enviar (Shift+Enter quebra a linha). No celular, uma coluna
  por vez, com botão de voltar.
- **Feed** (`/candidata/feed`): em telas a partir de 1024 px, coluna lateral com
  meu perfil (capa, foto, publicações, seguidoras e seguindo), "Complete seu
  perfil" (some quando chega a 100%), "Assuntos em alta", "Comunidades para
  você" (com Participar) e "Quem seguir". Em telas menores, "Pessoas para
  conhecer" aparece entre as publicações. As `#hashtags` do texto viram links
  para a busca de publicações em Explorar. A cada minuto (com a aba visível) o
  feed confere se há publicações novas e mostra o botão "N publicações novas",
  sem mexer na lista sozinho.
- Feed e comunidades: botão **Imagem** (prévia, trocar, remover); a foto é
  reduzida no navegador (lado maior até 1600 px) antes do envio.
- Menu da publicação: **Editar publicação**. Comentários: menu discreto com
  **Excluir comentário** e confirmação.
- `/candidata/pessoas/:id`: perfil da integrante (Seguir/Seguindo, Mensagem,
  publicações). `/candidata/pessoas/:id/conexoes?aba=seguidoras|seguindo`.
- `/candidata/mensagens`: abas **Candidatas** e **Empresas**, com "Nova
  conversa". Conversa entre candidatas em `/candidata/mensagens/candidatas/:id`.
- Editar perfil (candidata e empresa): **Usar um ícone**. Comunidades: ícone na
  criação e "Trocar ícone" para a criadora.
