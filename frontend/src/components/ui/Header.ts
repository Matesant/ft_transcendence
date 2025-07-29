export function renderHeader() {
  const header = document.createElement('header');
  header.innerHTML = `
    <span style="font-size:2rem;font-weight:bold;">42 Pong</span>
    <nav>
      <a href="#/">Home</a>
      <a href="#/game">Play</a>
      <a href="#/tournament">Tournament</a>
      <a href="#/login">Login</a>
    </nav>
  `;
  return header;
}