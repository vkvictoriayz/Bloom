# Login, cadastro e verificação de documentos

Como funcionam o login, o cadastro e a recuperação de senha da Bloom, para
candidatas e empresas, e o que ainda depende de configuração externa.

## Contas e sessão

- Candidatas (`CADASTRO_USUARIA`) e empresas (`CADASTRO_EMPRESA`) são contas
  separadas. O tipo vai dentro do token (JWT); as rotas conferem o tipo no
  servidor com `exigirLogin(["usuaria"])` ou `exigirLogin(["empresa"])`.
- Senhas: hash bcrypt (10 rodadas). Mínimo de 8 caracteres e até 72 bytes (o
  limite do bcrypt).
- O login responde o mesmo erro para e-mail inexistente e senha errada, e leva
  o mesmo tempo nos dois casos.
- Login e cadastro só funcionam com o servidor. Não existe mais o "modo
  demonstração" que guardava cadastros (com CPF e senha) no navegador; o que
  sobrou dele é apagado na próxima visita.

## Limites contra abuso

Em memória, por processo (`src/utils/limitador.js`):

| O quê | Limite |
| --- | --- |
| Login com senha errada | 5 por e-mail e IP a cada 15 min |
| Login (qualquer resultado) | 20 por IP por minuto |
| Cadastro (inclui tentativas com erro) | 20 por IP por hora |
| Consulta de CNPJ | 10 por IP por minuto (e cache de 10 min por CNPJ) |
| Pedido de redefinição de senha | 10 por IP por hora e 3 por e-mail por hora |

Atrás de um proxy reverso, ative `app.set("trust proxy", ...)` para que o IP
seja o de quem acessa. Com mais de um processo do servidor, troque o limitador
por um compartilhado (ex.: Redis).

## CPF — candidatas

**Serviço escolhido:** Serpro — Consulta CPF v3
([documentação](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cpf/)).
É o serviço oficial da Receita Federal, pago e sob contrato. Desde 2026 a v3 exige
o CPF **e a data de nascimento**, por isso o cadastro pede a data.

Como funciona (`src/services/cpf.js`):

1. O navegador confere os dígitos verificadores. O servidor confere de novo.
   Isso só mostra que o número é válido, não de quem ele é.
2. Com o Serpro configurado, o servidor consulta o CPF. A conta só fica como
   **verificada** quando o Serpro responde situação "Regular", o mesmo nome
   (sem diferenciar acentos e maiúsculas) e a mesma data de nascimento.
3. Dados que não conferem, CPF não encontrado ou situação irregular impedem o
   cadastro, com uma mensagem genérica.
4. Serviço fora do ar: a conta é criada com o CPF **pendente** de verificação.
5. Serpro não configurado: a conta é criada com o CPF **não verificado**.
   Nada é apresentado como verificado sem resposta real do serviço.

O resultado fica em `USUARIA_VERIFICACAO` (status, fonte e data). A data de
nascimento não é guardada, e o CPF não aparece nos logs.

## CNPJ — empresas

**Serviço escolhido:** BrasilAPI
([documentação](https://brasilapi.com.br/docs#tag/CNPJ)), gratuito e sem chave,
com os dados públicos do cadastro da Receita Federal.
Por ser gratuita, ela bloqueia rajadas de consultas: nos testes, depois de
algumas dezenas de consultas seguidas, passou a responder 403. A Bloom trata
isso como "serviço indisponível" e se protege com o cache de 10 minutos por
CNPJ e o limite de 10 consultas por minuto por IP. Para volume alto, troque
`CNPJ_API_URL` por um provedor contratado.

Como funciona (`src/services/cnpj.js`):

1. O navegador confere os dígitos verificadores e consulta
   `GET /api/auth/empresa/cnpj/:cnpj` (o servidor chama a BrasilAPI).
2. A tela mostra razão social, nome fantasia, situação cadastral, CNAE
   principal e município, para a pessoa conferir. Ela não digita esses dados.
3. Ao cadastrar, o servidor consulta o CNPJ **de novo** e usa só essa resposta.
4. **Regra da Bloom:** só empresas com situação **ATIVA** podem criar conta.
   Nula, suspensa, inapta ou baixada: o cadastro é recusado com orientação para
   escrever a contato@bloom.com.br.
5. CNPJ inválido (400), não encontrado (404), resposta incompleta (422) e
   serviço indisponível (503) têm mensagens próprias.
6. O CNAE principal é o da Receita. Ele não é a área de atuação escolhida no
   perfil da empresa na Bloom.

Os dados ficam em `EMPRESA_DADOS_CADASTRAIS`, junto com o nome e o cargo de
quem criou a conta. Os sócios (QSA) que a BrasilAPI devolve não são guardados.

**Representação:** a consulta confirma a empresa, não a pessoa. Quem cadastra
declara que pode representar a empresa (data registrada) e a conta fica com
`representante_status = "pendente"` até confirmar o vínculo por um destes
caminhos (migration 010 guarda o caminho e a data):

- **Domínio do e-mail** (automático, em Configurações → Verificação da empresa,
  `POST /api/empresa/verificacao`): CNPJ ATIVO, e-mail da conta confirmado pelo
  link, e-mail corporativo (não Gmail, Hotmail, Outlook, Yahoo, iCloud, UOL e
  outros provedores gratuitos) e no mesmo domínio do site informado no perfil
  (subdomínios valem: `rh.empresa.com.br` para `empresa.com.br`). Trocar o
  e-mail da conta desfaz essa verificação.
- **Equipe da Bloom** (manual, no painel da administração): a equipe confere
  por um canal oficial e confirma.

Empresas verificadas ganham o selo "Verificada" nas páginas públicas e no
perfil visto pelas candidatas. A regra está em `src/services/representante.js`.

## Recuperação de senha

1. `POST /api/auth/senha/esqueci { email, tipo }` responde sempre a mesma
   mensagem, exista ou não a conta.
2. Se a conta existe, é criado um token aleatório de uso único, válido por
   30 minutos. Só o hash SHA-256 do token fica no banco (`REDEFINICAO_SENHA`);
   um pedido novo invalida os anteriores.
3. O link `FRONTEND_URL/redefinir-senha?token=...` vai por e-mail pelo Resend
   ([documentação](https://resend.com/docs/api-reference/emails/send-email)).
4. `POST /api/auth/senha/redefinir { token, senha, confirmarSenha }` grava a
   nova senha e marca o token como usado.

Sem o Resend configurado nenhum e-mail sai. Em desenvolvimento
(`NODE_ENV` diferente de `production`) o e-mail aparece no terminal do servidor,
para testar o fluxo.

## Confirmação de e-mail (migration 008)

1. Ao se cadastrar (candidata ou empresa) e ao trocar o e-mail, a conta fica com
   o e-mail **não confirmado** e recebe um link
   `FRONTEND_URL/confirmar-email?token=...`, de uso único e válido por 24 horas.
   Só o hash SHA-256 do token fica no banco (`VERIFICACAO_EMAIL`), junto com o
   e-mail para o qual foi enviado: se a conta trocar de e-mail, o link antigo
   deixa de valer. Um link novo invalida os anteriores.
2. `POST /api/auth/email/confirmar { token }` (sem login) marca
   `email_verificado_em` na conta.
3. `POST /api/auth/email/reenviar` (logada) manda outro link, até 3 por hora por
   conta.
4. `/api/auth/me`, o login e o cadastro devolvem `usuario.emailVerificado`.

A confirmação não bloqueia nada: a área logada mostra o aviso "Confirme seu
e-mail" (com "Reenviar o link" e "Agora não") e Configurações mostra a
situação. Contas que já existiam antes da migration aparecem como não
confirmadas. Sem o Resend, em desenvolvimento o link aparece no terminal da API.

## Rotas

| Método | Rota | Para quê |
| --- | --- | --- |
| POST | `/api/auth/cadastro` | Cadastro de candidata (`nome, cpf, nascimento, email, telefone?, senha, confirmarSenha`) |
| POST | `/api/auth/login` | Login de candidata |
| GET | `/api/auth/empresa/cnpj/:cnpj` | Consulta pública do CNPJ para o formulário |
| POST | `/api/auth/empresa/cadastro` | Cadastro de empresa (`cnpj, nomeExibicao?, responsavelNome, responsavelCargo?, email, telefone?, senha, confirmarSenha, declaraRepresentacao`) |
| POST | `/api/auth/empresa/login` | Login de empresa |
| POST | `/api/auth/senha/esqueci` | Pede o link de redefinição |
| POST | `/api/auth/senha/redefinir` | Grava a nova senha |
| GET | `/api/auth/me` | Conta da sessão atual |

## Variáveis de ambiente

Veja `.env.example`. Nunca coloque os valores no código nem no frontend.

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `SERPRO_CPF_CONSUMER_KEY` | para verificar CPF | Credencial do contrato Serpro |
| `SERPRO_CPF_CONSUMER_SECRET` | para verificar CPF | Credencial do contrato Serpro |
| `SERPRO_CPF_URL` | para verificar CPF | Base da API contratada (a URL da v3 vem no contrato e na documentação do Serpro) |
| `SERPRO_TOKEN_URL` | não | Padrão: `https://gateway.apiserpro.serpro.gov.br/token` |
| `CNPJ_API_URL` | não | Padrão: `https://brasilapi.com.br/api/cnpj/v1` |
| `RESEND_API_KEY` | para enviar e-mails | Chave da conta no Resend |
| `EMAIL_REMETENTE` | para enviar e-mails | Remetente de um domínio verificado no Resend |
| `FRONTEND_URL` | já existia | Também usada para montar o link de redefinição |

## O que ainda depende de configuração externa

- **Verificação de CPF:** contratar a Consulta CPF no Serpro e preencher as três
  variáveis `SERPRO_CPF_*`. Até lá, toda conta nova fica com o CPF
  "não verificado".
- **E-mails (redefinição de senha e confirmação de e-mail):** criar conta no
  Resend, verificar um domínio e preencher `RESEND_API_KEY` e `EMAIL_REMETENTE`.
