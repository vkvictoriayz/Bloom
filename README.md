# Bloom

Plataforma que conecta mulheres a vagas de tecnologia. Front em React (Vite +
Tailwind) e API em Node.js (Express + Sequelize + MySQL) no **mesmo projeto**:
uma pasta `src/`, um `package.json` e um `npm install`.

## Estrutura (MVC)

```
src/
├── models/        M — tabelas do banco (Sequelize)
├── views/         V — o front em React
│   ├── main.jsx, App.jsx, index.css
│   ├── pages/         telas (públicas, candidata/, empresa/)
│   ├── components/    peças reutilizáveis das telas
│   ├── services/      chamadas do front para a API (/api/...)
│   ├── hooks/, lib/, utils/, data/, assets/
├── controllers/   C — regras de cada recurso (recebem a requisição, usam os models, respondem)
├── routes/        liga cada URL /api/... a uma função de controller
├── middlewares/   login obrigatório (token JWT)
├── services/      regras compartilhadas da API (notificações, CPF/CNPJ, e-mail, Mercado Pago…)
├── utils/         utilidades da API (JWT, senha, limitador de tentativas, documentos)
├── config/        conexão com o MySQL
├── database/      migrations SQL (rodam sozinhas ao iniciar a API)
├── app.js         configura o Express
└── server.js      conecta no banco, aplica as migrations e sobe a API
```

O front só fala com a API por HTTP (`src/views/services/api.js`); ele nunca
importa arquivos de models, controllers ou services da API.

## Como rodar

1. Execute `banco bloom.sql` no MySQL (cria o banco BLOOM).
2. Na raiz do projeto:
   ```bash
   npm install
   ```
   Toda a configuração fica em um único arquivo, o `.env` na raiz. Preencha pelo
   menos `DB_PASSWORD` e `JWT_SECRET`; as demais variáveis são opcionais.
3. Dois terminais, ambos na raiz:
   ```bash
   npm run server    # API   -> http://localhost:3001  (teste: /api/saude)
   npm run dev       # front -> http://localhost:3006
   ```
   A API reinicia ao rodar `npm run server` de novo; o front se atualiza sozinho.

### Login com Google e GitHub (opcional)

Sem as credenciais abaixo, os botões aparecem e avisam que o login social não foi configurado. Para ativar, adicione ao `.env`:

```
APP_URL=http://localhost:3006          # endereço do site (em produção, o domínio público)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

- **Google:** crie um "ID do cliente OAuth" (tipo Aplicativo da Web) no Google Cloud Console e cadastre o URI de redirecionamento
  `http://localhost:3006/api/auth/oauth/google/retorno`.
- **GitHub:** crie um OAuth App em Settings > Developer settings e use como callback
  `http://localhost:3006/api/auth/oauth/github/retorno`.

Depois reinicie o `npm run server`.

**"O servidor da Bloom não está respondendo" no login** = a API parou. Olhe o
terminal do `npm run server`: a mensagem logo acima diz o motivo (o mais comum é
o MySQL desligado ou o `.env` sem `DB_PASSWORD`/`JWT_SECRET`).

Requer Node 20.6+.

## Documentação

- [docs/autenticacao.md](docs/autenticacao.md) — login, cadastro, CPF/CNPJ, segurança
- [docs/area-candidata.md](docs/area-candidata.md) — área da candidata
- [docs/area-empresa-premium.md](docs/area-empresa-premium.md) — área da empresa, notificações e Bloom Premium
- [docs/rede-social.md](docs/rede-social.md) — imagens nas publicações, edição, mensagens entre candidatas, ícones e seguir
- [docs/administracao.md](docs/administracao.md) — painel da equipe (`/admin`), `npm run admin:criar` e `npm run admin:senha`
- [docs/STATUS.md](docs/STATUS.md) — o que está feito e o que falta, por área (checklist)
