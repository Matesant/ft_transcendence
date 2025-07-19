import { AView } from "../AView";

export class Settings extends AView
{
    public render(parent: HTMLElement = document.body): void{

        Array.from(parent.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
              document.body.removeChild(child);
            }
          });
          
            let element = document.createElement('p');
            element.textContent = "Settings";
            parent.appendChild(element);
    }

    public dispose(): void {
    }
}