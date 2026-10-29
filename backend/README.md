# Bloom — Backend (login e cadastro)

Node.js + Express + Sequelize (MySQL) + bcrypt, em MVC. Tudo faz parte do mesmo projeto:
uma única pasta, um único `package.json` e um único `npm install`.

## Estrutura (MVC)

```
backend/src/
├── config/database.js              # conexão Sequelize com o MySQL
├── models/                         # M — Usuaria.js, Empresa.js
├── controllers/AuthController.js   # C — regras de cadastro e login
├── routes/authRoutes.js            # liga cada rota a uma função do controller
├── middlewares/autenticacao.js     # confere o token nas rotas protegidas
├── utils/jwt.js                    # token de login
├── app.js                          # configura o Express
└── server.js                       # conecta no banco e sobe o servidor
```
A **View** é o front em React (`src/`).

## Como rodar

1. Execute `banco bloom.sql` no MySQL (cria o banco BLOOM).
2. Na raiz do projeto:
   ```bash
   npm install
   copy .env.example .env      # Linux/Mac: cp .env.example .env
   ```
   Abra o `.env` e preencha `DB_PASSWORD` e `JWT_SECRET`.
3. Use **dois terminais**, ambos na raiz do projeto:
   ```bash
   npm run server    # backend  -> http://localhost:3001  (teste: /api/saude)
   npm run dev       # front    -> http://localhost:5173
   ```

**Erro 502 (Bad Gateway) no cadastro/login** = o front não achou o backend. Confira se
`npm run server` está rodando e mostrou "Conectado ao MySQL" e "API da Bloom rodando".

Requer Node 20.6+.

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastra usuária |
| POST | `/api/auth/login` | Login da usuária |
| POST | `/api/auth/empresa/cadastro` | Cadastra empresa |
| POST | `/api/auth/empresa/login` | Login da empresa |
| GET | `/api/auth/me` | Quem está logada (`Authorization: Bearer <token>`) |

## Regras atuais (simples)

- CPF: sem validação (qualquer número de até 11 dígitos), só não pode repetir.
- Senha: mínimo 6 caracteres, salva com bcrypt.
- Depois de cadastrar, a usuária já fica logada.
