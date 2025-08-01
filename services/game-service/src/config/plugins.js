import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

// Plugin registration configuration
export async function registerPlugins(app) {
    // Register CORS
    await app.register(cors, {
        origin: `https://${process.env.IP || 'localhost'}:8080`,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
        exposedHeaders: ['Set-Cookie']
    });

    // Register Cookie support
    await app.register(cookie);

    // Register JWT
    await app.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-secret-key'
    });

    // Register WebSocket support
    await app.register(websocket);
}
