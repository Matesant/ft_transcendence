import { AView } from "../AView";
import { PongHeader, PongFooter } from "../../components/ui";

export class Players extends AView
{
    private elements: HTMLElement[] = [];
    private container!: HTMLDivElement;

    public async render(parent: HTMLElement = document.body): Promise<void> {
        parent.innerHTML = "";
        this.container = document.createElement("div");
        this.container.className = "min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans";
        parent.appendChild(this.container);
        this.elements.push(this.container);

        const headerContainer = document.createElement("div");
        headerContainer.className = "w-full";
        headerContainer.appendChild(PongHeader({ homeOnly: false }));
        this.container.appendChild(headerContainer);

        const main = document.createElement("main");
        main.className = "flex flex-1 flex-col items-center w-full px-4 max-w-5xl mx-auto pt-8";

        const card = document.createElement("div");
        card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full";

        let element = document.createElement('players-table');
        card.appendChild(element);
        
        main.appendChild(card);
        this.container.appendChild(main);

        this.container.appendChild(PongFooter());
    }

    public dispose(): void {
        this.elements.forEach((el) => el.parentNode?.removeChild(el));
        this.elements = [];
    }
}