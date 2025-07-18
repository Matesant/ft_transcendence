export class Sidebar {
    public static getHtml(): string {
        return `

      <aside id="default-sidebar" class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
         <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
            <ul class="space-y-2 font-medium">
            <item-sidebar href="/">Home</item-sidebar>
            <item-sidebar href="/lobby">Lobby</item-sidebar>
            <item-sidebar href="/tournament">Tournament</item-sidebar>
            <item-sidebar href="/game">Game</item-sidebar>
            <item-sidebar href="/login">Login</item-sidebar>
            <item-sidebar href="/register">Register</item-sidebar>
            </ul>
         </div>
      </aside>
        `;
    }
}