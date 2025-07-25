import { AView } from "../AView";

export class twoFa extends AView
{
    public render(): void{

        let alias = sessionStorage.getItem("alias"); 

        document.body.className = "bg-gradient-to-br from-indigo-500 to-purple-600 text-white h-screen";
        let twoFaElement = document.createElement('two-factor-auth');
        twoFaElement.alias = alias;

        document.body.appendChild(twoFaElement);
    }

    public dispose(): void {

      Array.from(document.body.children).forEach(child => {
          document.body.removeChild(child);
      });
    }
}