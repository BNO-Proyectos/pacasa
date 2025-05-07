const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initializeCronJobs } = require('./cronJob');
const { initializeHubspot } = require('../src/services/hubspot/client');
const hubspot = require('@hubspot/api-client');
const config = require('../src/config/environment');

const hubspotClient = new hubspot.Client({ 
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    numberOfApiCallRetries: 3
});

const startJobs = async () => {
    try {
        console.log('Iniciando jobs...');
        await initializeHubspot();
        initializeCronJobs();
        console.log('Jobs iniciados correctamente');
    } catch (error) {
        console.error('Error iniciando los jobs:', error);
        process.exit(1);
    }
};

startJobs();