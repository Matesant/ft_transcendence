import { AView } from "../AView";

export class Player extends AView
{
    public async render(parent: HTMLElement = document.body): Promise<void> {

            document.body.innerHTML = `<left-sidebar></left-sidebar> <player-profile></player-profile>`;
    }

    public dispose(): void {
    }
}