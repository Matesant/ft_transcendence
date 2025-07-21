import { apiUrl } from "./api";
import { navigateTo } from "../router/Router";

export interface UserProfile {
  id: number;
  alias: string;
  display_name: string | null;
  avatar: string | null;
  wins: number;
  losses: number;
}

export interface AuthUser {
  id: number;
  alias: string;
  email: string;
  is_2fa_enabled: number;
}

/**
 * Verifica se o usuário está autenticado
 * @returns Promise<AuthUser | null>
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(apiUrl(3001, "/auth/verify"), {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data: {
      authenticated: boolean;
      user?: AuthUser;
      error?: string;
    } = await response.json();

    return data.authenticated && data.user ? data.user : null;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return null;
  }
}

/**
 * Obtém o perfil completo do usuário atual
 * @returns Promise<UserProfile | null>
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch(apiUrl(3003, "/users/me"), {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Verifica autenticação e redireciona para login se necessário
 * @returns Promise<AuthUser | null> - retorna o usuário se autenticado, null caso contrário
 */
export async function requireAuth(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) {
    navigateTo("/login");
    return null;
  }
  return user;
}

/**
 * Obtém o nome de exibição do usuário (display_name ou alias como fallback)
 * @param profile - Perfil do usuário
 * @returns string - Nome para exibição
 */
export function getDisplayName(profile: UserProfile): string {
  return profile.display_name && profile.display_name.trim() ? profile.display_name : profile.alias;
}

/**
 * Obtém o nome do usuário atual para usar no lobby
 * @returns Promise<string | null>
 */
export async function getCurrentUserDisplayName(): Promise<string | null> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return null;
    }
    // Usa display_name se existir e não for nulo/vazio, caso contrário usa alias
    return profile.display_name && profile.display_name.trim() ? profile.display_name : profile.alias;
  } catch (error) {
    console.error("Error getting current user display name:", error);
    return null;
  }
}
