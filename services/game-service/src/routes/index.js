import { generalRoutes } from '../routes/generalRoutes.js';
import { gameRoutes } from '../routes/gameRoutes.js';
import { websocketRoutes } from '../routes/websocketRoutes.js';

export async function registerRoutes(app, services) {
    await app.register(generalRoutes, services);

    await app.register(gameRoutes, services);

    await app.register(websocketRoutes, services);
}
