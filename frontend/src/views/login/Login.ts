import { AView } from "../AView";

export class Login extends AView {
    
    private element: HTMLElement;

    public render()
    {
        document.body.innerHTML = `
            <div class="flex items-center justify-center h-screen bg-gray-100">
                <div class="bg-white p-8 rounded-lg shadow-md w-96">
                    <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
                    <form id="register-form">
                        <div class="mb-4">
                            <label for="username" class="block text-sm font-medium text-gray-700">Alias</label>
                            <input type="text" id="username" name="alias" required
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                        <div class="mb-4">
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" id="password" name="password" required
                                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                        <button type="submit"
                                class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">Register</button>
                    </form>
                </div>
            </div>
        `;

        let form = document.getElementById("register-form");
        if (form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
    
                const formData = new FormData(form as HTMLFormElement);
                const data = {
                    alias: formData.get("alias"),
                    password: formData.get("password"),
                };

                try {
                    const response = await fetch("http://localhost:3001/auth/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data)
                    });
    
                    if (response.ok) {
                        const result = await response.json();
                        document.body.innerHTML = "<h1 class='text-center text-2xl font-bold'>Login Successful!</h1>";
                    } else {
                        const errorResponse = await response.json();
                        console.error("Registration failed:", errorResponse.error);
                        document.body.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Login Failed: ${errorResponse.error}</h1>`;
                    }
                } catch (error) {
                    console.error("Error during registration:", error);
                }
            });
        }

    }

    public dispose(): void {
    }
}