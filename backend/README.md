# 📘 API - ft\_transcendence

## 📦 Base URL

```
http://localhost:3000
```

> Todas as rotas protegidas exigem autenticação via JWT:

```
Authorization: Bearer <TOKEN>
```

---

## 🔐 Auth

### POST /auth/register

Registra um novo jogador.

**Payload:**

```json
{
  "alias": "mateus",
  "password": "1234"
}
```

**Resposta:**

```json
{
  "success": true,
  "alias": "mateus"
}
```

---

### POST /auth/login

Autentica o jogador e retorna um token JWT.

**Payload:**

```json
{
  "alias": "mateus",
  "password": "1234"
}
```

**Resposta:**

```json
{
  "token": "eyJhbGciOi..."
}
```

---

### GET /auth/profile

Retorna os dados do jogador autenticado.

**Resposta:**

```json
{
  "message": "Você está autenticado!",
  "user": {
    "alias": "mateus",
    "id": 1,
    "iat": 1747600000
  }
}
```

---

## 👥 Jogadores

### GET /players

Lista todos os jogadores registrados.

**Resposta:**

```json
[
  { "alias": "mateus", "created_at": "2025-05-20 12:00:00" },
  { "alias": "carol", "created_at": "2025-05-20 12:01:00" }
]
```

---

## 🏓 Torneio

### POST /match

Cria a primeira rodada de confrontos.

**Resposta:**

```json
{
  "matches": [
    { "player1": "mateus", "player2": "carol" },
    { "winner": "lucas", "status": "walkover" }
  ]
}
```

---

### GET /match/next

Retorna a próxima partida a ser jogada.

**Resposta:**

```json
{
  "match": {
    "id": 3,
    "player1": "mateus",
    "player2": "carol"
  }
}
```

Se não houver mais partidas:

```json
{
  "match": null,
  "message": "No more matches available"
}
```

---

### POST /match/score

Registra o vencedor de uma partida.

**Payload:**

```json
{
  "matchId": 3,
  "winner": "mateus"
}
```

**Resposta:**

```json
{
  "success": true,
  "matchId": 3,
  "winner": "mateus"
}
```

---

### POST /match/advance

Gera a próxima rodada com os vencedores da anterior.

**Resposta:**

```json
{
  "round": 2,
  "matches": [
    { "player1": "mateus", "player2": "lucas" },
    { "winner": "carol", "status": "walkover" }
  ]
}
```

---

### GET /match/tournament

Retorna o estado completo do torneio, agrupado por rodadas.

**Resposta:**

```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        { "player1": "mateus", "player2": "lucas", "winner": "mateus", "status": "done" },
        { "player1": "carol", "player2": null, "winner": "carol", "status": "done" }
      ]
    },
    {
      "round": 2,
      "matches": [
        { "player1": "mateus", "player2": "carol", "winner": null, "status": "pending" }
      ]
    }
  ]
}
```

---

## 🧭 Fluxo de uso sugerido

1. Registro e login do jogador: `/auth/register` e `/auth/login`
2. Criação dos confrontos: `POST /match`
3. Jogo busca partida: `GET /match/next`
4. Jogo envia resultado: `POST /match/score`
5. Backend gera próxima rodada: `POST /match/advance`
6. Frontend/jogo lista o torneio completo: `GET /match/tournament`
