export function apiUrl(port: number, path: string): string {
  const protocol = window.location.protocol;
  const host = process.env.IP || window.location.hostname;
  return `${protocol}//${host}:${port}${path}`;
}
