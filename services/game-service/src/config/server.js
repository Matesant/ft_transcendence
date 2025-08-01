import { readFileSync } from 'node:fs';

// Server configuration
export const serverConfig = {
    logger: true,
    keepAliveTimeout: 30000,
    connectionTimeout: 30000,
    https: {
        cert: readFileSync('/app/server.crt'),
        key: readFileSync('/app/server.key')
    }
};

// Application settings
export const appConfig = {
    port: process.env.PORT || 3004,
    host: '0.0.0.0'
};
