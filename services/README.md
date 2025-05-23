# 🎮 ft_transcendence - API (Microsserviços)

API backend baseada em **Fastify + SQLite**, com autenticação JWT e sistema de torneio com rounds, WO (walkover) e múltiplas fases.

---

## 🧰 Como rodar o projeto

```bash
make setup      # cria arquivos .env se necessário
make build      # compila os microsserviços
make up         # sobe auth-service e match-service
make logs       # acompanha logs dos serviços
```

- Auth: [`http://localhost:3001`](http://localhost:3001)
- Match: [`http://localhost:3002`](http://localhost:3002)

---

## 🔐 Auth-service

> **Base URL:** `http://localhost:3001/auth`

Todas as rotas abaixo retornam JSON.  
Rotas protegidas exigem header:

```http
Authorization: Bearer <TOKEN>
```

---

### ✅ POST /auth/register

Registra um novo jogador.

#### Requisição:
```json
{
  "alias": "mateus",
  "password": "1234",
  "email": "mateus@email.com"
}
```

#### Resposta:
```json
{
  "success": true,
  "alias": "mateus"
}
```

---

### 🔐 POST /auth/2fa/request

Autentica por senha e envia um código 2FA para o e-mail.

#### Requisição:
```json
{
  "alias": "mateus",
  "password": "1234"
}
```

#### Resposta:
```json
{
  "success": true,
  "message": "Código enviado por e-mail"
}
```

---

### 🔐 POST /auth/2fa/verify

Confirma o código e retorna um JWT.

#### Requisição:
```json
{
  "alias": "mateus",
  "code": "123456"
}
```

#### Resposta:
```json
{
  "token": "eyJhbGciOi..."
}
```

---

### 🔐 GET /auth/profile

Exemplo de rota protegida. Retorna dados do jogador autenticado.

```bash
curl http://localhost:3001/auth/profile   -H "Authorization: Bearer <TOKEN>"
```

---

## 🏓 Match-service

> **Base URL:** `http://localhost:3002/match`

Requer JWT em todas as rotas via:

```http
Authorization: Bearer <TOKEN>
```

---

### 🧾 POST /match

Cria a primeira rodada com os jogadores fornecidos.

#### Requisição:
```json
{
  "players": ["mateus", "jorge", "lucas"]
}
```

#### Resposta:
```json
{
  "matches": [
    { "player1": "mateus", "player2": "jorge" },
    { "wo": "lucas" }
  ]
}
```

> ⚠️ Se o número de jogadores for ímpar, o último avança automaticamente (WO = walkover).

---

### ⏭️ GET /match/next

Retorna a próxima partida pendente (status = `"pending"`).

#### Resposta:
```json
{
  "match": {
    "id": 2,
    "player1": "mateus",
    "player2": "caio",
    "status": "pending",
    "round": 2
  }
}
```

---

### 🏆 POST /match/score

Define o vencedor de uma partida.

#### Requisição:
```json
{
  "matchId": 2,
  "winner": "mateus"
}
```

#### Resposta:
```json
{
  "success": true,
  "matchId": 2,
  "winner": "mateus"
}
```

> ⚠️ Partidas do tipo `wo` ou `done` não podem ser pontuadas.

---

### ➕ POST /match/advance

Gera a próxima rodada com os vencedores da rodada anterior (`status = done || wo`).

#### Resposta:
```json
{
  "round": 2,
  "matches": [
    { "player1": "mateus", "player2": "lucas" },
    { "wo": "ana" }
  ]
}
```

---

### 🧩 GET /match/tournament

Retorna todas as rodadas agrupadas por fase.

#### Resposta:
```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        { "id": 1, "player1": "mateus", "player2": "jorge", "status": "done" },
        { "id": 2, "player1": "lucas", "status": "wo", "winner": "lucas" }
      ]
    },
    {
      "round": 2,
      "matches": [
        { "id": 3, "player1": "mateus", "player2": "lucas", "status": "pending" }
      ]
    }
  ]
}
```

---

## 🔁 Fluxo resumido (Frontend)

```mermaid
graph TD
A[POST /auth/register] --> B[POST /auth/2fa/request]
B --> C[POST /auth/2fa/verify → JWT]
C --> D[POST /match → cria jogos]
D --> E[GET /match/next → próxima partida]
E --> F[POST /match/score → vencedor]
F --> G[POST /match/advance → próxima rodada]
G --> H[GET /match/tournament → estrutura total]
```

---

## 🔑 JWT para testes

Durante o desenvolvimento, você pode gerar manualmente um token JWT válido:

```js
require('jsonwebtoken').sign({ alias: 'dev', id: 42 }, 'jorge-super-secrets')
```

Use o token para testar o match-service sem passar pelo 2FA completo.

---

## 🧠 Convenções de `status` em partidas

| Status   | Significado |
|----------|-------------|
| `pending` | Partida ainda não resolvida |
| `done`    | Vencedor registrado manualmente |
| `wo`      | Jogador avançou automaticamente (walkover) |

---

## 📌 Notas para o frontend

- Sempre aguarde a resposta de `/match` ou `/advance` para saber a estrutura real.
- O frontend **não precisa gerar os confrontos** — só envia `["a", "b", "c", ...]`.
- Jogadores com `status = wo` já têm `winner` definido e **não devem entrar em jogos ativos**.
- Partidas com `player2 = null` não são válidas — são WO ou erro.

---

## 🔒 Segurança

- Toda rota protegida exige `Authorization: Bearer <TOKEN>`
- Usuários só podem alterar dados de sua própria sessão
- 2FA é obrigatório após login, mas pode ser desativado pelo usuário

---

## 📁 Microsserviços

| Serviço       | Porta         | Descrição                          |
|---------------|---------------|------------------------------------|
| auth-service  | `:3001`       | Registro, login, 2FA, JWT          |
| match-service | `:3002`       | Torneios, partidas, placar, rounds |