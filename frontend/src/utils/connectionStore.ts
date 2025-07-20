export { setWsManager, getWsManager };
import { WebSocketManager } from './WebSocketManager';

let wsManager: WebSocketManager | null = null;

function setWsManager(manager: WebSocketManager) {
  wsManager = manager;
}

function getWsManager(): WebSocketManager | null {
  return wsManager;
}
