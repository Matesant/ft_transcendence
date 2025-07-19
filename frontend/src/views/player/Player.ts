import { AView } from "../AView";

export class Player extends AView
{
    public render(parent: HTMLElement = document.body): void{


          
            let element = document.createElement('player-profile');
            parent.appendChild(element);
    }

    public dispose(): void {
      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}