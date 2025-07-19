
/**
 * Generates a simple room code for lobby
 * @param length - Length of the code (default: 6)
 * @returns A random alphanumeric code
 */
export function generateRoomCode(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a lobby ID in the format used by the game service
 * @returns A lobby ID string
 */
export function generateLobbyId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `lobby_${random}_${timestamp}`;
}


