const axios = require('axios');
const { getLast24HoursDate } = require('../../utils/dateHelpers');
const { createOrUpdateContact } = require('./contact');
const { createDeal, findExistingDeal, updateDeal } = require('./deal');
const { contactMappings, dealMappings } = require('./mappings');
const config = require('../../config/environment');

const getPipelineAndDealstage = (customerPostingGroup) => {
    switch (customerPostingGroup) {
        case 'CLIENTEEXP':
            return { pipeline: 117216025, dealstage: 207899299 };
        case 'CLIENTETDA':
            return { pipeline: 132758702, dealstage: 229518770 };
        case 'CLIENTESPS':
        case 'CLIENTETGU':
            return { pipeline: 141816114, dealstage: 242302336 };
        default:
            console.log(`CustomerPostingGroup no reconocido: ${customerPostingGroup}`);
            return { pipeline: "default", dealstage: "appointmentscheduled" };
    }
};

const processContacts = async (contacts) => {
    console.log('Iniciando procesamiento de contactos...');
    
    for (const contact of contacts) {
        try {
            // Validación específica para fidelidad
            if (contact.MemberClub === 'FIDELIDAD') {
                if (!contact.MemberName || !contact.PhoneNo || !contact.ContactNo) {
                    console.log('Saltando contacto de fidelidad con campos obligatorios faltantes');
                    continue;
                }
                await createOrUpdateContact(contactMappings['fidelidad'](contact));
                continue;
            }

            // Para otros tipos, verificar si es nuevo o actualización
            const isUpdate = contact.LastDateModified && 
                new Date(contact.LastDateModified) > new Date(contact.DateCreated || 0);

            console.log(`Procesando ${isUpdate ? 'actualización' : 'nuevo'} contacto:`, 
                contact.CustomerName, 
                isUpdate ? `(Última modificación: ${contact.LastDateModified})` : ''
            );

            // Resto de la validación para otros tipos
            switch (contact.Customer_Posting_Group) {
                case 'CLIENTEEXP':
                case 'CLIENTESPS':
                case 'CLIENTETDA':
                case 'CLIENTETGU':
                    await processContactAndDeal(contact, 'mayoreo-tienda', isUpdate);
                    break;
                case 'CLIENTELIC':
                    await processContactAndDeal(contact, 'licitacion', isUpdate);
                    break;
                default:
                    console.log('Saltando contacto con Customer_Posting_Group no válido:', contact.Customer_Posting_Group || contact.CustomerPostingGroup || contact);
                    continue;
            }
        } catch (error) {
            console.error('Error procesando contacto:', error);
            continue;
        }
    }
};

const processContactAndDeal = async (contact, tipoCaso, isUpdate) => {
    try {
        // Crear o actualizar contacto
        const contactId = await createOrUpdateContact(contactMappings[tipoCaso](contact));
        
        if (!contactId) {
            console.log('No se pudo crear/actualizar el contacto');
            return;
        }

        // Si es una actualización, buscar y actualizar el deal existente
        if (isUpdate) {
            console.log(`Buscando deal existente para contacto ${contact.CustomerName}`);
            const existingDeal = await findExistingDeal(contactId);
            if (existingDeal) {
                console.log(`Actualizando deal existente: ${existingDeal.id}`);
                const dealProperties = dealMappings[tipoCaso](contact, {
                    dealname: contact.CustomerName || 'Sin Nombre'
                });
                await updateDeal(existingDeal.id, dealProperties);
                return;
            }
            console.log('No se encontró deal existente, creando uno nuevo');
        }

        // Si no es actualización o no se encontró deal existente, crear uno nuevo
        console.log(`Creando nuevo deal para contacto ${contact.CustomerName}`);
        const pipelineInfo = getPipelineAndDealstage(contact.Customer_Posting_Group);
        const dealProperties = dealMappings[tipoCaso](contact, {
            dealname: contact.CustomerName || 'Sin Nombre',
            pipeline: pipelineInfo.pipeline,
            dealstage: pipelineInfo.dealstage
        });

        await createDeal({
            properties: dealProperties,
            associations: [{
                to: { id: contactId },
                types: [{
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 3
                }]
            }]
        });
    } catch (error) {
        console.error('Error en processContactAndDeal:', error);
        throw error;
    }
};

const executeFullSync = async () => {
    console.log('\n=== Iniciando sincronización completa ===');
    console.log('Fecha y hora de inicio:', new Date().toISOString());
    // const startDate = "2025-03-20"
    const startDate = getLast24HoursDate();
    console.log('Rango de fechas:');
    console.log('- Desde:', startDate);
    console.log('- Hasta:', new Date().toISOString());
    console.log('=====================================\n');
    
    try {
        // Obtener datos de clientes nuevos
        const { data: mayoreoResponse } = await axios.get(`${config.hubspot.apiBase}/unified-v6`, {
            params: { startDate }
        });
        
        const { data: cooperativaResponse } = await axios.get(`${config.hubspot.apiBase}/cooperativa-v6`, {
            params: { startDate }
        });

        const { data: licitacionResponse } = await axios.get(`${config.hubspot.apiBase}/licitacion-v6`, {
            params: { startDate }
        });

        // Obtener datos de clientes actualizados
        const { data: mayoreoUpdatedResponse } = await axios.get(`${config.hubspot.apiBase}/unified-v6/updated`, {
            params: { startDate }
        });
        
        const { data: cooperativaUpdatedResponse } = await axios.get(`${config.hubspot.apiBase}/cooperativa-v6/updated`, {
            params: { startDate }
        });

        const { data: licitacionUpdatedResponse } = await axios.get(`${config.hubspot.apiBase}/licitacion-v6/updated`, {
            params: { startDate }
        });

        // Obtener datos de fidelidad (solo creación)
        const { data: fidelidadResponse } = await axios.get(`${config.hubspot.apiBase}/fidelidad-v6`, {
            params: { startDate }
        });

        // Mostrar análisis
        console.log('\nAnálisis mayoreo nuevos:', mayoreoResponse.analysis);
        console.log('Análisis mayoreo actualizados:', mayoreoUpdatedResponse.analysis);
        console.log('\nAnálisis cooperativa nuevos:', cooperativaResponse.analysis);
        console.log('Análisis cooperativa actualizados:', cooperativaUpdatedResponse.analysis);
        console.log('\nAnálisis licitación nuevos:', licitacionResponse.analysis);
        console.log('Análisis licitación actualizados:', licitacionUpdatedResponse.analysis);
        console.log('\nAnálisis fidelidad:', fidelidadResponse.analysis);

        // Combinar resultados
        const allContacts = [
            ...(mayoreoResponse.results || []), 
            ...(mayoreoUpdatedResponse.results || []),
            ...(cooperativaResponse.results || []),
            ...(cooperativaUpdatedResponse.results || []),
            ...(licitacionResponse.results || []),
            ...(licitacionUpdatedResponse.results || []),
            ...(fidelidadResponse.results || [])
        ];

        if (allContacts.length === 0) {
            console.log('No se encontraron contactos para procesar');
            return;
        }

        console.log('\nTotal contactos a procesar:', allContacts.length);
        await processContacts(allContacts);
        
        console.log('Sincronización completa finalizada');
    } catch (error) {
        console.error('Error en la sincronización:', error);
    }
};

module.exports = {
    executeFullSync,
    processContacts,
    processContactAndDeal
};