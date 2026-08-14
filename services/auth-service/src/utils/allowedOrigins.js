// Origens (frontend) autorizadas a chamar este serviço.
// localhost/127.0.0.1 são sempre aceitos; IP e ALLOWED_HOSTS (lista separada por
// vírgula, ex: "expo3.42sp.org.br,192.168.1.10") adicionam os hosts do deploy.
const FRONTEND_PORT = process.env.FRONTEND_PORT || '8080'

function originFor (host) {
  return FRONTEND_PORT === '443' ? `https://${host}` : `https://${host}:${FRONTEND_PORT}`
}

const hosts = ['localhost', '127.0.0.1', process.env.IP, ...(process.env.ALLOWED_HOSTS || '').split(',')]
  .map(host => (host || '').trim())
  .filter(Boolean)

export const allowedOrigins = [...new Set(hosts.map(originFor))]
