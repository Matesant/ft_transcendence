// Todos os serviços são servidos na mesma origem do frontend: o nginx (ou o
// proxy do dev-server) encaminha por prefixo de rota. O parâmetro `port` é
// mantido apenas para não quebrar as chamadas existentes.
export function apiUrl(_port: number, path: string): string {
  return `${window.location.origin}${path}`;
}
