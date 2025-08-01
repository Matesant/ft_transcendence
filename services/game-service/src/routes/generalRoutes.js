// General API Routes (health check, etc.)
export async function generalRoutes(fastify, options) {
    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
        return { 
            status: 'ok', 
            service: 'game-service', 
            timestamp: new Date().toISOString() 
        };
    });
}
