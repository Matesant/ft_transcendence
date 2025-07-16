import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";

export class Players extends AView
{
    public async render(parent: HTMLElement = document.body): Promise<void> {

        // let player = sessionStorage.getItem("selected_player");
        // if (player) {
        // document.body.innerHTML = `${Sidebar.getHtml()} <player-profile></player-profile>`;
        // }
        // else {
            document.body.innerHTML = `${Sidebar.getHtml()} <players-table></players-table>`;
        // }
    }

    public dispose(): void {
    }
}