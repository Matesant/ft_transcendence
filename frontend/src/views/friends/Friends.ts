import { AView } from "../AView";

export class Friends extends AView
{
    public render(): void{

    }

    public dispose(): void {
      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}