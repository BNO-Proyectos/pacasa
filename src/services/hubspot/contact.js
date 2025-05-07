const { hubspotClient } = require('./client');
const { fixAndValidateEmail, generateEmail } = require('../../utils/validators');
const { departamentosMap } = require('../../constants/mappings');

const getContactByEmail = async (email) => {
    try {
        const response = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [{
                filters: [{
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email
                }]
            }],
            properties: ['email', 'firstname'],
            limit: 1
        });
        return response.results[0];
    } catch (error) {
        if (error.message.includes('RATE_LIMIT')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getContactByEmail(email);
        }
        console.error('Error buscando contacto:', error);
        return null;
    }
};

const createOrUpdateContact = async (properties) => {
    try {
        // Crear una copia del objeto properties para usarlo como contact
        const contact = {
            CustomerEmail: properties.email,
            ContactEmail: properties.email,
            MemberEmail: properties.email,
            VAT_Registration_No: properties.vat_registration_no,
            VATRegistrationNo: properties.vat_registration_no,
            ContactNo: properties.contact_no,
            DNI: properties.dni
        };

        // Primero generar email si es necesario
        let email = generateEmail(contact);
        
        // Luego validar y corregir el formato
        email = fixAndValidateEmail(email);
        console.log('Email generado:', email);
        
        if (!email) {
            console.log('No se puede crear/actualizar contacto sin email válido');
            return null;
        }

        // Actualizar el email en las propiedades
        properties.email = email;

        const existingContact = await getContactByEmail(email);
        
        if (existingContact) {
            console.log(`Actualizando contacto existente: ${email}`);
            const updated = await hubspotClient.crm.contacts.basicApi.update(
                existingContact.id,
                { properties }
            );
            return updated.id;
        } else {
            console.log(`Creando nuevo contacto: ${email}`);
            const created = await hubspotClient.crm.contacts.basicApi.create(
                { properties }
            );
            return created.id;
        }
    } catch (error) {
        if (error.message.includes('RATE_LIMIT')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return createOrUpdateContact(properties);
        }
        console.error('Error creando/actualizando contacto:', error);
        return null;
    }
};

const getDepartamentoFromPostCode = (postCode) => {
    if (!postCode) return 'Francisco Morazón';
    const cleanPostCode = String(postCode).trim();
    return departamentosMap[cleanPostCode] || departamentosMap.default;
};

module.exports = {
    getContactByEmail,
    createOrUpdateContact,
    getDepartamentoFromPostCode
};