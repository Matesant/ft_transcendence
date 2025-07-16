import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";

export class Dashboard extends AView {

  public render(parent: HTMLElement = document.body): void {

      parent.innerHTML = `
        ${Sidebar.getHtml()}
      `;
  }

  public dispose(): void {}
}
