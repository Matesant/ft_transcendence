import fastify from 'fastify';
import dotenv from 'dotenv';

import { serverConfig, appConfig } from './config/server.js';
import { registerPlugins } from './config/plugins.js';

import { initializeServices } from './services/serviceManager.js';
import { registerRoutes } from './routes/index.js';

dotenv.config();

async function createApp() {
    const app = fastify(serverConfig);

    await registerPlugins(app);

    const services = initializeServices();

    await registerRoutes(app, services);

    return app;
}

const start = async () => {
    try {
        const app = await createApp();
        await app.listen({ port: appConfig.port, host: appConfig.host });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
