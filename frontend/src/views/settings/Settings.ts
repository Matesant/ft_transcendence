import { AView } from "../AView";

export class Settings extends AView
{
    public render(): void{
      
        document.body.innerHTML  = "<settings-info></settings-info><enable-2fa-button></enable-2fa-button> <disable-2fa-button></disable-2fa-button>";
    }

    public dispose(): void {

      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}