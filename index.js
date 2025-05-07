const express = require('express');
const { initializeHubspot } = require('./src/services/hubspot/client');
const dynamicsRoutes = require('./src/services/dynamics/endpoints');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/test', dynamicsRoutes);

const startServer = async () => {
    try {
        await initializeHubspot();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            
            // Señal para PM2 de que la aplicación está lista
            if (process.send) {
                process.send('ready');
            }
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer(); 