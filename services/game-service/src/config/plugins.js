import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

export async function registerPlugins(app) {
    await app.register(cors, {
        origin: `https://${process.env.IP || 'localhost'}:8080`,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
        exposedHeaders: ['Set-Cookie']
    });

    await app.register(cookie);

    await app.register(jwt, {
        secret: process.env.JWT_SECRET || 'your-secret-key'
    });

    await app.register(websocket);
}
