import { AView } from "../AView";

export class Home extends AView {
    private element: HTMLElement;

    public render() {
        this.element = document.createElement("p");
        this.element.innerHTML = `
        <h1>Welcome to ft_transcendence</h1>
        <p>This is a paragraph.</p>
        <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/game">Game</a></li>
          <li><a href="/login">Login</a></li>
        </ul>
      `;
        document.body.appendChild(this.element);
    }

    public dispose(): void {
        this.element.remove();
    }
}