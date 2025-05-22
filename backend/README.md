# 📘 API - ft\_transcendence

## 🫕 Como rodar o backend diretasso

```
npm install
npm run dev
```

## 📆 Base URL

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
  "password": "1234",
  "email": "jorge@jorge.com"
}
```

**curl:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"alias": "mateus", "password": "1234", "email": "jorge@jorge.com"}'
```

**Resposta:**

```json
{
  "success": true,
  "alias": "mateus"
}
```

---

### POST /auth/2fa/request

Valida alias + senha e envia um código 2FA para o email do jogador.

**Payload:**

```json
{
  "alias": "mateus",
  "password": "1234"
}
```

**curl:**

```bash
curl -X POST http://localhost:3000/auth/2fa/request \
  -H "Content-Type: application/json" \
  -d '{"alias": "mateus", "password": "1234"}'
```

**Resposta:**

```json
{
  "success": true,
  "message": "Código enviado por e-mail"
}
```

---

### POST /auth/2fa/verify

Confirma o código recebido por e-mail e retorna o token JWT de autenticação.

**Payload:**

```json
{
  "alias": "mateus",
  "code": "123456"
}
```

**curl:**

```bash
curl -X POST http://localhost:3000/auth/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{"alias": "mateus", "code": "123456"}'
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

**curl:**

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

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

**curl:**

```bash
curl http://localhost:3000/players \
  -H "Authorization: Bearer <TOKEN>"
```

**Resposta:**

```json
[
  { "alias": "mateus", "created_at": "2025-05-20 12:00:00" },
  { "alias": "jorge", "created_at": "2025-05-20 12:01:00" }
]
```

---

## 🏓 Torneio

### POST /match

Cria a primeira rodada de confrontos.

**curl:**

```bash
curl -X POST http://localhost:3000/match \
  -H "Authorization: Bearer <TOKEN>"
```

**Resposta:**

```json
{
  "matches": [
    { "player1": "mateus", "player2": "jorge" },
    { "winner": "lucas", "status": "walkover" }
  ]
}
```

---

### GET /match/next

Retorna a próxima partida a ser jogada.

**curl:**

```bash
curl http://localhost:3000/match/next \
  -H "Authorization: Bearer <TOKEN>"
```

**Resposta:**

```json
{
  "match": {
    "id": 3,
    "player1": "mateus",
    "player2": "jorge"
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

**curl:**

```bash
curl -X POST http://localhost:3000/match/score \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"matchId": 3, "winner": "mateus"}'
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

**curl:**

```bash
curl -X POST http://localhost:3000/match/advance \
  -H "Authorization: Bearer <TOKEN>"
```

**Resposta:**

```json
{
  "round": 2,
  "matches": [
    { "player1": "mateus", "player2": "lucas" },
    { "winner": "jorge", "status": "walkover" }
  ]
}
```

---

### GET /match/tournament

Retorna o estado completo do torneio, agrupado por rodadas.

**curl:**

```bash
curl http://localhost:3000/match/tournament \
  -H "Authorization: Bearer <TOKEN>"
```

**Resposta:**

```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        { "player1": "mateus", "player2": "lucas", "winner": "mateus", "status": "done" },
        { "player1": "jorge", "player2": null, "winner": "jorge", "status": "done" }
      ]
    },
    {
      "round": 2,
      "matches": [
        { "player1": "mateus", "player2": "jorge", "winner": null, "status": "pending" }
      ]
    }
  ]
}
```

---

## 🪩 Fluxo de uso sugerido

1. Registro do jogador: `POST /auth/register`
2. Login com senha: `POST /auth/2fa/request`
3. Confirmação do código: `POST /auth/2fa/verify`
4. Criação dos confrontos: `POST /match`
5. Jogo busca partida: `GET /match/next`
6. Jogo envia resultado: `POST /match/score`
7. Backend gera próxima rodada: `POST /match/advance`
8. Frontend/jogo lista o torneio completo: `GET /match/tournament`
