import { AView } from "../AView";

export class Dashboard extends AView {

  public render(parent: HTMLElement = document.body): void {

      parent.innerHTML = `
        <left-sidebar></left-sidebar>
      `;
  }

  public dispose(): void {}
}
