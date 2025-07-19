import { AView } from "../AView";


export class Tournament extends AView {
    
    private element: HTMLElement;

    public async render()
    {
      let round_in_progress = sessionStorage.getItem("round_in_progress");
      
      if (round_in_progress === "true") {
        document.body.innerHTML = `
          <left-sidebar></left-sidebar>
          <tournament-rounds></tournament-rounds>
      `;
      }
      else {
        document.body.innerHTML = `
         <left-sidebar></left-sidebar>
          <start-tournament></start-tournament>
      `;
      }

    }

    public dispose(): void {
    }
}