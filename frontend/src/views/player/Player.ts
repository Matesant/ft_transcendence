import { AView } from "../AView";

export class Player extends AView
{
    public render(parent: HTMLElement = document.body): void{

        Array.from(parent.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
              document.body.removeChild(child);
            }
          });
          
            let element = document.createElement('player-profile');
            parent.appendChild(element);
    }

    public dispose(): void {
    }
}