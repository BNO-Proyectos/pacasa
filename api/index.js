const app = require('./server');
const config = require('../src/config/environment');
const { initializeHubspot } = require('../src/services/hubspot/client');

const startServer = async () => {
    try {
        // Inicializar HubSpot
        await initializeHubspot();

        // Iniciar servidor
        app.listen(config.server.port, () => {
            console.log(`API escuchando en http://localhost:${config.server.port}`);
            if (process.send) {
                process.send('ready');
            }
        });
    } catch (error) {
        console.error('Error iniciando el servidor:', error);
        process.exit(1);
    }
};

startServer();