import { AView } from "../AView";

export class Dashboard extends AView {

  public render(parent: HTMLElement = document.body): void {

    Array.from(document.body.children).forEach(child => {
      if (child.tagName.toLowerCase() !== 'left-sidebar') {
        document.body.removeChild(child);
      }
    });
    
  }

  public dispose(): void {}
}
