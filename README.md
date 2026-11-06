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
   copy .env.example .env      # Linux/Mac: cp .env.example .env
   ```
   Preencha no `.env` pelo menos `DB_PASSWORD` e `JWT_SECRET`. As demais
   variáveis estão explicadas no `.env.example`.
3. Dois terminais, ambos na raiz:
   ```bash
   npm run server    # API   -> http://localhost:3001  (teste: /api/saude)
   npm run dev       # front -> http://localhost:5173
   ```

**Erro 502 no login/cadastro** = o front não achou a API. Confira se
`npm run server` mostrou "Conectado ao MySQL" e "API da Bloom rodando".

Requer Node 20.6+.

## Documentação

- [docs/autenticacao.md](docs/autenticacao.md) — login, cadastro, CPF/CNPJ, segurança
- [docs/area-candidata.md](docs/area-candidata.md) — área da candidata
- [docs/area-empresa-premium.md](docs/area-empresa-premium.md) — área da empresa, notificações e Bloom Premium
