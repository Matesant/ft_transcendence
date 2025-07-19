import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";

export class Players extends AView
{
    public async render(parent: HTMLElement = document.body): Promise<void> {

            document.body.innerHTML = `${Sidebar.getHtml()} <players-table></players-table>`;
    }

    public dispose(): void {
    }
}