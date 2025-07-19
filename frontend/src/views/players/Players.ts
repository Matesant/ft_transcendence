import { AView } from "../AView";

export class Players extends AView
{
    public async render(parent: HTMLElement = document.body): Promise<void> {

            document.body.innerHTML = `<left-sidebar></left-sidebar> <players-table></players-table>`;
    }

    public dispose(): void {
    }
}