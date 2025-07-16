import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";

export class Home extends AView {

    public render() {
        document.body.innerHTML = `
        ${Sidebar.getHtml()}
      `;
    }

    public dispose(): void {

    }
}