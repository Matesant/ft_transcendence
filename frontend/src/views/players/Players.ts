import { AView } from "../AView";

export class Players extends AView
{
    public async render(parent: HTMLElement = document.body): Promise<void> {

        Array.from(parent.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
              document.body.removeChild(child);
            }
          });
          
            let element = document.createElement('players-table');
            parent.appendChild(element);
    }

    public dispose(): void {
    }
}