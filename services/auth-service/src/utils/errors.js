export function badRequest(reply, message, hint = null) {
  return reply.status(400).send({
    status: 400,
    error: 'BadRequest',
    message,
    hint
  })
}

export function unauthorized(reply, message = 'Invalid or missing token') {
  return reply.status(401).send({
    status: 401,
    error: 'Unauthorized',
    message
  })
}

export function notFound(reply, message) {
  return reply.status(404).send({
    status: 404,
    error: 'NotFound',
    message
  })
}

export function forbidden(reply, message) {
  return reply.status(403).send({
    status: 403,
    error: 'Forbidden',
    message
  })
}

export function conflict(reply, message = 'Conflict with existing data') {
  return reply.status(409).send({
    status: 409,
    error: 'Conflict',
    message
  })
}
