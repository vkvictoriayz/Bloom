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
| `GET /` | Conversas (outra participante, última mensagem, não lidas). |
| `POST /` | `{ usuariaId }` abre ou reabre a conversa do par. Perfil oculto não recebe conversa nova. |
| `GET /:id` | Histórico; marca como lidas as recebidas. Só as duas participantes. |
| `POST /:id` | `{ texto }` (até 1000). Avisa a outra pela notificação "mensagem" (respeita a preferência). |

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
