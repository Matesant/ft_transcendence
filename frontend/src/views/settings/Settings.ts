import { AView } from "../AView";

export class Settings extends AView
{
    public render(): void{
      
        document.body.innerHTML  = "<select-avatar></select-avatar>";
    }

    public dispose(): void {

      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}