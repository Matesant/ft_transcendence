# 📘 API - ft\_transcendence (Microsserviços)

## 🔧 Como rodar o projeto

```bash
make setup      # cria arquivos .env automaticamente se não existirem
make build      # builda todos os serviços
make up         # sobe auth-service e match-service
make logs       # visualiza logs de ambos
```

A API roda com múltiplos microsserviços acessíveis por URLs distintas:

* `http://localhost:3001` → auth-service
* `http://localhost:3002` → match-service

> Todas as rotas protegidas exigem autenticação via JWT:
>
> **Header obrigatório:**
>
> ```http
> Authorization: Bearer <TOKEN>
> ```

---

## 🔐 Auth-service (`localhost:3001`)

### POST /auth/register

Registra um novo jogador.

```json
{
  "alias": "mateus",
  "password": "1234",
  "email": "mateus@email.com"
}
```

### POST /auth/2fa/request

Valida o alias + senha e envia código 2FA por e-mail.

```json
{
  "alias": "mateus",
  "password": "1234"
}
```

### POST /auth/2fa/verify

Confirma o código e retorna um token JWT.

```json
{
  "alias": "mateus",
  "code": "123456"
}
```

**Resposta 200 OK:**

```json
{
  "token": "eyJhbGciOi..."
}
```

**Resposta 401 Unauthorized:**

```json
{
  "error": "Código inválido ou expirado"
}
```

### GET /auth/profile *(exemplo de rota protegida)*

```bash
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🏓 Match-service (`localhost:3002`)

### POST /match

Cria a primeira rodada de confrontos.

```json
{
  "players": ["mateus", "jorge", "lucas"]
}
```

> ⚠️ Os aliases devem ser válidos. O frontend é responsável por garantir isso.

### GET /match/next

Retorna a próxima partida pendente.

### POST /match/score

Registra o vencedor de uma partida.

```json
{
  "matchId": 3,
  "winner": "mateus"
}
```

### POST /match/advance

Gera a próxima rodada com os vencedores da anterior.

### GET /match/tournament

Retorna todas as rodadas agrupadas por fase.

---

## 🔁 Fluxo de uso sugerido

```text
[ Register ] → /auth/register
    ↓
[ Login ] → /auth/2fa/request
    ↓
[ Código ] → /auth/2fa/verify → JWT
    ↓
[ Token ] → usado em chamadas para /match/*
```

1. Registro via `POST /auth/register`
2. Login + 2FA com `POST /auth/2fa/request` e `POST /auth/2fa/verify`
3. Frontend envia `players[]` válidos para `POST /match`
4. Jogo consulta com `GET /match/next`
5. Jogo envia resultado com `POST /match/score`
6. Backend gera novas rodadas com `POST /match/advance`
7. Front ou admins consultam tudo com `GET /match/tournament`

---

## 🧪 Ambiente de desenvolvimento

* auth-service → `http://localhost:3001`
* match-service → `http://localhost:3002`

> Em produção, pode haver um gateway (ex: Nginx) unificando tudo em `api.domain.com/auth` e `api.domain.com/match`

---

## 🧪 JWT de teste para desenvolvimento

Você pode gerar um token válido manualmente:

```js
require('jsonwebtoken').sign({ alias: 'teste', id: 99 }, 'jorge-super-secrets')
```

Use esse token com rotas protegidas do match-service se quiser pular o 2FA durante testes.
