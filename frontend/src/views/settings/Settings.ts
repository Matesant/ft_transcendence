import { AView } from "../AView";

export class Settings extends AView
{
    public render(): void{
      
        document.body.innerHTML  = `<settings-info></settings-info>`;
    }

    public dispose(): void {

      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}