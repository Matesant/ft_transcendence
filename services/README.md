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
Rotas marcadas com [🔐 Requer autenticação] exigem o header:

```http
Authorization: Bearer <TOKEN>
```

---

### ✅ POST /auth/register

Registra um novo jogador.

#### Requisição:
```json
{
  "alias": "jorge",
  "password": "1234",
  "email": "jorge@email.com"
}
```

#### Resposta:
```json
{
  "success": true,
  "alias": "jorge"
}
```

---

### 🔐 POST /auth/2fa/request

Autentica por senha e envia um código 2FA para o e-mail.

#### Requisição:
```json
{
  "alias": "jorge",
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
  "alias": "jorge",
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

### 🛡️ POST /auth/2fa/enable [🔐 Requer autenticação]

Ativa a autenticação 2FA para o jogador logado.

#### Requisição:
```json
{
  "alias": "jorge"
}
```

#### Resposta:
```json
{
  "success": true,
  "message": "2FA ativado com sucesso."
}
```

---

### 🛡️ POST /auth/2fa/disable [🔐 Requer autenticação]

Desativa a autenticação 2FA para o jogador logado.

#### Requisição:
```json
{
  "alias": "jorge"
}
```

#### Resposta:
```json
{
  "success": true,
  "message": "2FA desativado com sucesso."
}
```

---

## 🏓 Match-service

> **Base URL:** `http://localhost:3002/match`

Todas as rotas abaixo [🔐 Requerem autenticação].

---

### 🧾 POST /match [🔐 Requer autenticação]

Cria a primeira rodada com os jogadores fornecidos.

#### Requisição:
```json
{
  "players": ["jorge", "jorge", "lucas"]
}
```

#### Resposta:
```json
{
  "matches": [
    { "player1": "jorge", "player2": "jorge" },
    { "wo": "lucas" }
  ]
}
```

---

### ⏭️ GET /match/next [🔐 Requer autenticação]

Retorna a próxima partida pendente (status = `"pending"`).

---

### 🏆 POST /match/score [🔐 Requer autenticação]

Define o vencedor de uma partida.

#### Requisição:
```json
{
  "matchId": 2,
  "winner": "jorge"
}
```

---

### ➕ POST /match/advance [🔐 Requer autenticação]

Gera a próxima rodada com os vencedores da rodada anterior (`status = done || wo`).

---

### 🧩 GET /match/tournament [🔐 Requer autenticação]

Retorna todas as rodadas agrupadas por fase.

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