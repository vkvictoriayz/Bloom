# Bloom — Backend (login e cadastro)

API em Node.js + Express + MySQL.

## Como rodar

1. Crie o banco executando o arquivo `banco bloom.sql` (na raiz do projeto) no MySQL.
2. Dentro de `backend/`:
   ```bash
   npm install
   cp .env.example .env     # no Windows: copy .env.example .env
   ```
   Abra o `.env` e preencha `DB_PASSWORD` e `JWT_SECRET`.
3. Inicie a API:
   ```bash
   npm run dev
   ```
   Ela sobe em http://localhost:3001 (teste: http://localhost:3001/api/saude).
4. Em outro terminal, na raiz do projeto, inicie o front:
   ```bash
   npm install
   npm run dev
   ```
   O Vite repassa tudo que começa com `/api` para a porta 3001.

Requer Node 20.6 ou superior. Testes: `npm test` (dentro de `backend/`).

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastra usuária (valida CPF) |
| POST | `/api/auth/login` | Login da usuária |
| POST | `/api/auth/empresa/cadastro` | Cadastra empresa (valida CNPJ) |
| POST | `/api/auth/empresa/login` | Login da empresa |
| GET | `/api/auth/me` | Dados de quem está logada (header `Authorization: Bearer <token>`) |

Cadastro da usuária — corpo JSON:
```json
{ "nome": "Maria Silva", "cpf": "529.982.247-25", "email": "maria@email.com",
  "telefone": "(11) 91234-5678", "senha": "senhaForte1", "confirmarSenha": "senhaForte1" }
```
`telefone` é opcional. Respostas de sucesso: `{ "token": "...", "usuario": { "id", "nome", "email", "tipo" } }`.
Erros: `{ "erro": "mensagem", "campo": "cpf" }` (400 dados inválidos, 401 login incorreto, 409 CPF/e-mail já cadastrado).

## O que acontece no cadastro

- CPF: remove a máscara, confere os dígitos verificadores e recusa sequências como `111.111.111-11`.
  Isso garante que o número é válido; não consulta a Receita Federal.
- CPF e e-mail não podem repetir (409).
- Senha: mínimo de 8 caracteres, guardada em `senha_hash` com scrypt (nunca em texto puro).
- Em uma única transação são criados `CADASTRO_USUARIA`, `PERFIL_USUARIA` e `CONFIG_USUARIA`
  (se um falhar, nenhum é salvo). Empresa segue o mesmo modelo.
- O login devolve um token JWT (8h por padrão) que o front guarda no `localStorage`.
