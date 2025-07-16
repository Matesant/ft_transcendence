import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";


export class Tournament extends AView {
    
    private element: HTMLElement;

    public async render()
    {
      let round_in_progress = sessionStorage.getItem("round_in_progress");
      
      if (round_in_progress === "true") {
        document.body.innerHTML = `
          ${Sidebar.getHtml()}
          <tournament-rounds></tournament-rounds>
      `;
      }
      else {
        document.body.innerHTML = `
          ${Sidebar.getHtml()}
          <start-tournament></start-tournament>
      `;
      }

    }

    public dispose(): void {
    }
}