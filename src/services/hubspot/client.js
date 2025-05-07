const hubspot = require('@hubspot/api-client');
const config = require('../../config/environment');

const hubspotClient = new hubspot.Client({
    accessToken: config.hubspot.accessToken,
    defaultHeaders: { 'Content-Type': 'application/json' }
});

const initializeHubspot = async () => {
    try {
        await hubspotClient.crm.contacts.basicApi.getPage();
        console.log('Conexión con HubSpot establecida correctamente');
    } catch (error) {
        console.error('Error conectando con HubSpot:', error);
        process.exit(1);
    }
};

module.exports = {
    hubspotClient,
    initializeHubspot
};