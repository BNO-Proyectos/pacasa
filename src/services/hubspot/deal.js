const { hubspotClient } = require('./client');
const { fixAndValidateEmail } = require('../../utils/validators');

const getDealByName = async (dealName) => {
    try {
        const response = await hubspotClient.crm.deals.searchApi.doSearch({
            filterGroups: [{
                filters: [{
                    propertyName: 'dealname',
                    operator: 'EQ',
                    value: dealName.trim()
                }]
            }],
            properties: ['dealname'],
            limit: 1
        });
        return response.total > 0;
    } catch (error) {
        if (error.message.includes('RATE_LIMIT')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getDealByName(dealName);
        }
        console.error('Error buscando negocio:', error);
        return false;
    }
};

const createDeal = async (dealData, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    try {
        if (!hubspotClient?.crm?.deals?.basicApi) {
            throw new Error('Cliente de HubSpot no inicializado correctamente');
        }

        if (!dealData.properties || !dealData.properties.dealname) {
            throw new Error('Estructura de deal inválida: falta dealname');
        }

        console.log('Intentando crear deal:', dealData.properties.dealname);
        const created = await hubspotClient.crm.deals.basicApi.create(dealData);
        console.log('Deal creado exitosamente:', created);
        return created.id;
    } catch (error) {
        console.error(`Error creando deal (intento ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

        if ((error.code === 'ECONNRESET' || error.message.includes('RATE_LIMIT')) && retryCount < MAX_RETRIES) {
            console.log(`Reintentando en ${RETRY_DELAY/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createDeal(dealData, retryCount + 1);
        }

        throw new Error(`Error final creando deal después de ${retryCount + 1} intentos: ${error.message}`);
    }
};

const findExistingDeal = async (contactId) => {
    try {
        const response = await hubspotClient.crm.deals.searchApi.doSearch({
            filterGroups: [{
                filters: [{
                    propertyName: 'associations.contact',
                    operator: 'EQ',
                    value: contactId
                }]
            }],
            sorts: ['hs_lastmodifieddate'],
            limit: 1
        });
        return response.results[0];
    } catch (error) {
        console.error('Error buscando deal existente:', error);
        return null;
    }
};

const updateDeal = async (dealId, properties) => {
    try {
        console.log(`Actualizando deal ${dealId} con propiedades:`, properties);
        const updated = await hubspotClient.crm.deals.basicApi.update(dealId, { properties });
        console.log('Deal actualizado exitosamente');
        return updated;
    } catch (error) {
        if (error.message.includes('RATE_LIMIT')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return updateDeal(dealId, properties);
        }
        console.error('Error actualizando deal:', error);
        throw error;
    }
};

module.exports = {
    getDealByName,
    createDeal,
    findExistingDeal,
    updateDeal
};