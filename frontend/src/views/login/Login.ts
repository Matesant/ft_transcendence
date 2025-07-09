import { AView } from "../AView";

export class Login extends AView {
    
    private element: HTMLElement;

    public render()
    {
        this.element = document.createElement("p");
        this.element.innerText = "Login View";
        document.body.appendChild(this.element);
    }

    public dispose(): void {
        this.element.remove();
    }
}