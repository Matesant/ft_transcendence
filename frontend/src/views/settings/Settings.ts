import { AView } from "../AView";

export class Settings extends AView
{
    public render(): void{

        document.body.className = "bg-gradient-to-br from-indigo-500 to-purple-600 text-white h-screen";
        let settingsInfo = document.createElement('settings-info');

        document.body.appendChild(settingsInfo);
    }

    public dispose(): void {

      Array.from(document.body.children).forEach(child => {
          document.body.removeChild(child);
      });
    }
}