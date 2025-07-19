import { AView } from "../AView";


export class Tournament extends AView {
    
    private element: HTMLElement;

    public async render()
    {


      
      
      let round_in_progress = sessionStorage.getItem("round_in_progress");
      
      if (round_in_progress === "true") {

        let element = document.createElement('tournament-rounds');
        document.body.appendChild(element);
      }
      else {
        let element = document.createElement('start-tournament');
        document.body.appendChild(element);
      }

    }

    public dispose(): void {
      Array.from(document.body.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'left-sidebar') {
          document.body.removeChild(child);
        }
      });
    }
}