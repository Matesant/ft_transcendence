import { apiUrl } from "./api";

export async function login(alias: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(apiUrl(3001, "/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ alias, password })
    });
    return response.ok;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}
