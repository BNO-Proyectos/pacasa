require('dotenv').config();

const hubspot = require('@hubspot/api-client');
const axios = require('axios');
const cron = require('node-cron');

// Configuración
const config = {
    hubspotAccessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    dynamicsApiBase: 'http://localhost:3000/api/test',
    dynamicsApiEndpointDealsBase: 'http://localhost:3000/api/test',
};

// Configuración del cliente de HubSpot con manejo de errores
const hubspotClient = new hubspot.Client({
    accessToken: config.hubspotAccessToken,
    defaultHeaders: { 'Content-Type': 'application/json' }
});

// Verificar la conexión al iniciar
(async () => {
    try {
        await hubspotClient.crm.contacts.basicApi.getPage();
        console.log('Conexión con HubSpot establecida correctamente');
    } catch (error) {
        console.error('Error conectando con HubSpot:', error);
        process.exit(1);  // Terminar el proceso si no podemos conectar con HubSpot
    }
})();

// Función para obtener la fecha de las últimas 24 horas en formato ISO
const getLast24HoursDate = () => {
    const now = new Date();
    now.setHours(now.getHours() - 24);
    return now.toISOString();
};

// Mapeos de valores
const origenMap = { 0: "Local", 1: "Foranea" };
const tipoCuentaMap = {
    0: "Privado", 1: "Familia", 2: "Empresa", 3: "Director", 4: "Profesor"
};
const unidadDeNegocio1 = {
    "CLIENTEEXP": "EXPORTACION",
    "CLIENTELIC": "LICITACION",
    "CLIENTESPS": "OFFICE SPS",
    "CLIENTETDA": "TIENDAS",
    "CLIENTETGU": "OFFICE TGU",
    "CXCEMPLEA": "EMPLEADOS"
};
const unidadDeNegocio2 = {
    "CLIENTEEXP": "Exportaciones",
    "CLIENTESPS": "Mayoreo",
    "CLIENTETDA": "Tiendas",
    "CLIENTETGU": "Mayoreo"
};

// Agregar mapeo de segmentos al inicio del archivo junto con los otros mapeos
const segmentoMap = {
    'COMERCIALIZADORA': 'Comercializadora',
    'INSTITUCIONAL': 'Institucional',
    'VENTA CORPORATIVA': 'Venta Corporativa',
    'EMPLEADOS': 'Empleados'
};

// Mapeo de códigos postales a departamentos
const departamentosMap = {
    // Atlántida
    '14202': 'Atlántida',
    '31101': 'Atlántida',
    '31301': 'Atlántida',
    
    // Choluteca
    '51101': 'Choluteca',
    '51102': 'Choluteca',
    '51201': 'Choluteca',
    '52105': 'Choluteca',
    
    // Colón
    '32101': 'Colón',
    '32301': 'Colón',
    '52111': 'Colón',
    '52112': 'Colón',
    '52113': 'Colón',
    
    // Comayagua
    '12101': 'Comayagua',
    '12111': 'Comayagua',
    
    // Copán
    '41101': 'Copán',
    '41102': 'Copán',
    '41103': 'Copán',
    '41202': 'Copán',
    '52107': 'Copán',
    '52109': 'Copán',
    
    // Cortés
    '21000': 'Cortés',
    '21101': 'Cortés',
    '21102': 'Cortés',
    '21103': 'Cortés',
    '21104': 'Cortés',
    '21105': 'Cortés',
    '21106': 'Cortés',
    '21107': 'Cortés',
    '21112': 'Cortés',
    '21301': 'Cortés',
    '52103': 'Cortés',
    
    // El Paraíso
    '13101': 'El Paraíso',
    '13201': 'El Paraíso',
    '13202': 'El Paraíso',
    '13203': 'El Paraíso',
    
    // Francisco Morazán
    '11101': 'Francisco Morazón',
    '11102': 'Francisco Morazón',
    
    // Valor por defecto
    'default': 'Francisco Morazón'
};

// Función auxiliar para convertir código postal a departamento
const getDepartamentoFromPostCode = (postCode) => {
    if (!postCode) return 'Francisco Morazón';  // valor por defecto si no hay código postal
    
    // Convertir a string y limpiar el código postal
    const cleanPostCode = String(postCode).trim();
    
    // Buscar el departamento correspondiente
    const departamento = departamentosMap[cleanPostCode];
    
    if (!departamento) {
        console.log(`Código postal no encontrado: ${cleanPostCode}, usando valor por defecto`);
        return departamentosMap.default;
    }
    
    return departamento;
};

// Función auxiliar para normalizar el segmento
const normalizeSegmento = (segmento) => {
    if (!segmento) return 'Comercializadora'; // valor por defecto
    
    // Convertir a mayúsculas para hacer la comparación
    const upperSegmento = segmento.toUpperCase();
    return segmentoMap[upperSegmento] || 'Comercializadora';
};

// Utilidades
const fixAndValidateEmail = (email) => {
    // Log para depuración
    console.log('Validando email:', email);

    // Si no hay email, retornar null
    if (!email || !email.includes('@')) {
        console.log(`Email inválido o vacío: ${email}`);
        return null;
    }

    // Expresión regular para validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const [localPart, domain] = email.split('@');
    const domainCorrections = { 
        hn: '.hn', 
        HN: '.HN', 
        com: '.com', 
        COM: '.COM', 
        es: '.es', 
        ES: '.ES', 
        org: '.org', 
        ORG: '.ORG',
    };

    // Validar que el dominio no comience con un punto
    if (domain.startsWith('.')) {
        console.log('Dominio inválido: comienza con punto');
        return null;
    }

    // Aplicar correcciones al dominio si es necesario
    const correctedDomain = Object.entries(domainCorrections)
        .find(([key]) => domain.toLowerCase() === key.toLowerCase());

    const correctedEmail = correctedDomain
        ? `${localPart}@${correctedDomain[1]}`
        : email;

    // Validar formato final del email
    if (!emailRegex.test(correctedEmail)) {
        console.log(`Email con formato inválido: ${correctedEmail}`);
        return null;
    }

    console.log('Email validado y corregido:', correctedEmail);
    return correctedEmail.toLowerCase(); // Convertir a minúsculas para consistencia
};

// Modificar cleanRTN para manejar valores undefined o null
const cleanRTN = (rtn) => {
    if (!rtn) return '';  // Retornar string vacío si el RTN es null o undefined
    return rtn.replace(/\D/g, '');
};

// Modificar la función determinarTipoCaso
const determinarTipoCaso = (contact) => {


    if (contact.CustomerPriceGroup === 'MAYORISTA') {
        return 'mayoreo-tienda';
    } else if (contact.Cooperativa === 1) {
        return 'cooperativa';
    } else if (contact.MemberClub) {
        return 'fidelidad';
    } else if (contact.CustomerPostingGroup === 'CLIENTELIC') {
        return 'licitacion';
    }

    // Si no coincide con ningún caso, log detallado
    console.log('No se pudo determinar el tipo de caso. Valores encontrados:', {
        CustomerPriceGroup: contact.CustomerPriceGroup,
        Cooperativa: contact.Cooperativa,
        MemberClub: contact.MemberClub,
        CustomerPostingGroup: contact.CustomerPostingGroup
    });

    return null;
};

// Función auxiliar para obtener la última transacción válida
const getLastValidTransaction = (transacciones) => {
    if (!transacciones || !transacciones.length) return null;
    
    // Filtrar transacciones con Net_Amount válido y ordenar por Transaction_No
    const validTransactions = transacciones
        .filter(t => t.Net_Amount != null)
        .sort((a, b) => b.Transaction_No - a.Transaction_No);
    
    return validTransactions[0] || null;
};

// Agregar un mapeo para instituciones
const institucionMap = {
    'SECRETARIA DE FINANZAS': 'Entidad Pública',
    'SECRETARIA DE ENERGIA': 'Entidad Pública',
    'SECRETARIA': 'Entidad Pública',
    'MINISTERIO': 'Entidad Pública',
    'HOSPITAL': 'Hospitales',
    'IGLESIA': 'Iglesias',
    'HOTEL': 'Hoteles',
    'ONG': 'O.N.G',
    'SEGURIDAD': 'Empresa de seguridad',
    'ZONA LIBRE': 'Zona Libre',
    'default': 'Institucional'
};

// Función auxiliar para determinar el tipo de institución
const determinarTipoInstitucion = (nombre) => {
    if (!nombre) return 'Institucional';
    const nombreUpper = nombre.toUpperCase();
    
    // Mapeo de palabras clave a tipos de institución
    const tiposInstitucion = {
        'SECRETARIA': 'Entidad Pública',
        'MINISTERIO': 'Entidad Pública',
        'HOSPITAL': 'Hospitales',
        'IGLESIA': 'Iglesias',
        'HOTEL': 'Hoteles',
        'ONG': 'O.N.G',
        'SEGURIDAD': 'Empresa de seguridad',
        'ZONA LIBRE': 'Zona Libre'
    };

    // Buscar coincidencias
    for (const [keyword, tipo] of Object.entries(tiposInstitucion)) {
        if (nombreUpper.includes(keyword)) {
            return tipo;
        }
    }

    return 'Institucional'; // Valor por defecto
};

// Mapeos específicos por tipo de caso para contactos
const contactMappings = {
    'mayoreo-tienda': (data, commonProps) => {
        const lastTransaction = getLastValidTransaction(data.transacciones);
        
        return {
        ...commonProps,
            categorizacion: data.Categoria_Contado || '',
            codigo_de_segmento: data.Cod_Segmento || '',
            codigo_del_cliente: data.CustomerNo || '',
            condiciones_de_pago: data.Payment_Terms_Code || '',
            departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
            documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
            metodo_de_pago_contado: data.Payment_Method_Code || '',
            company: data.CustomerName || '',
            representante_legal: data.ContactName || '',
            responsable_de_compra: data.Job_Responsibility_Code || '',
            rtn: cleanRTN(data.VAT_Registration_No),
            segmento: normalizeSegmento(data.Segmento),
            tipo_de_credito: data.CodigoTemporada || 'NORMAL',
            atributo_departamento: data['Attrib 2 Code'] || '',
            unidad_de_negocio_dynamics: unidadDeNegocio1[data.Customer_Posting_Group] || '',
            email: data.CustomerEmail || data.ContactEmail || '',
            entry_no: data.Entry_No || '',
            cust_ledger_entry: data.Entry_No || '',
            codigo_de_factura: data.Document_No || '',
            id_de_cliente: data.CustomerNo || '',
            no__tienda: lastTransaction?.Store_No || '',
            monto_neto: lastTransaction?.Net_Amount || 0,
            codigo_de_factura: lastTransaction?.Receipt_No || '',
        };
    },

    'cooperativa': (data, commonProps) => {
        const lastTransaction = getLastValidTransaction(data.transacciones);
        return {
        ...commonProps,
            categorizacion: data['Categoria Contado'] || '',
            codigo_de_segmento: data['Cod Segmento'] || '',
            codigo_del_cliente: data.CustomerNo || '',
            condiciones_de_pago: data['Payment Terms Code'] || '',
            departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
            documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
            metodo_de_pago_contado: data['Payment Method Code'] || '',
            company: data.CustomerName || '',
            representante_legal: data.ContactName || '',
            responsable_de_compra: data['Job Responsibility Code'] || '',
        rtn: cleanRTN(data['VAT Registration No_']),
            segmento: normalizeSegmento(data.Segmento),
            tipo_de_credito: data.CodigoTemporada || 'NORMAL',
            atributo_departamento: data['Attrib 2 Code'] || '',
            unidad_de_negocio_dynamics: unidadDeNegocio1[data['Customer Posting Group']] || '',
            email: data.CustomerEmail || data.ContactEmail || '',
            entry_no: data['Entry No_'] || '',
            cust_ledger_entry: data['Entry No_'] || '',
            codigo_de_factura: data['Document No_'] || '',
            id_de_cliente: data.CustomerNo || '',
            no__tienda: lastTransaction?.Store_No || '',
            monto_neto: lastTransaction?.Net_Amount || 0,
            codigo_de_factura: lastTransaction?.Receipt_No || ''
        };
    },

    'fidelidad': (data, commonProps) => {
        // Usar los mapeos existentes para departamentos e instituciones
        const departamento = departamentosMap[data.City] || departamentosMap.default;
        
        // Buscar el tipo de institución usando el mapeo existente
        let tipoInstitucion = institucionMap.default; // Por defecto 'Institucional'
        if (data.AccountDescription) {
            const descripcionUpper = data.AccountDescription.toUpperCase();
            for (const [keyword, tipo] of Object.entries(institucionMap)) {
                if (descripcionUpper.includes(keyword) && tipo !== 'default') {
                    tipoInstitucion = tipo;
                    break;
                }
            }
        }

        return {
        ...commonProps,
            // Mapeo directo de los campos principales
            email: data.MemberEmail || '',                 
            firstname: data.MemberName || '',              
            phone: data.PhoneNo || '',                    
            club_miembros: data.ClubMiembro || '',        
            cod_club: data.CodigoClub || '',              
            cod_esquema: data.CodigoEsquema || '',        
            esquema_membresia: data.EsquemaMiembro || '', 

            // Campos que necesitan valores específicos
            institucional: tipoInstitucion,
            departamentos_mayoreo: departamento,

            // Resto de campos del contacto
            bloqueado: data.Blocked || '',
            categorizacion: data.ClubDestino || '',
            city: data.City || '',
            club_destino: data.ClubDestino || '',
            codigo_de_la_escuela: data.AccountNo || '',
            codigo_de_segmento: data['Cod Segmento'] || '',
            codigo_del_cliente: data.ContactNo || '',
            condiciones_de_pago: data['Payment Terms Code'] || '',
            confirmar_dni: data.ContactNo || '',
            contacto_principal: data.MemberName || '',
            cuenta_destino: data.CuentaDestino || '',
            dni: data.ContactNo || '',
            documetacion_de_politicas_de_pago__credito_: data.AccountDescription || '',
            fecha_member_point_entry: data.Date || '',
            fecha_caducidad: data['Expiration Date'] || '',
            fecha_de_nacimiento: data['Date of Birth'] || '',
            gender: data.Gender || '',
            metodo_de_pago_contado: data['Payment Method Code'] || '',
            no_cuenta: data.AccountNo || '',
            no_contacto: data.ContactNo || '',
            no__tarjeta: data.CardNo || '',
            nombre_contacto_principal: data.MemberName || '',
            nombre_de_la_escuela: data.AccountDescription || '',
            nombre_del_director: data.MemberName || '',
            origen: data.Origen || '',
            porcentaje: data.Porcentaje || '',
            puntos: data.Points || 0,
            puntos_restantes: data.RemainingPoints || 0,
            company: data.AccountDescription || '',
            tipo_mov_: data.EntryType || '',
            tipo_procedencia_mov_: data.SourceType || '',
            tipo_puntos: data.PointType || '',
            cerrado_por_puntos: data.ClosedByPoints || '',
        };
    },

    'licitacion': (data, commonProps) => {
        const lastTransaction = getLastValidTransaction(data.transacciones);
        return {
        ...commonProps,
            categorizacion: data['Categoria Contado'] || '',
            codigo_de_segmento: data['Cod Segmento'] || '',
            codigo_del_cliente: data.CustomerNo || '',
            condiciones_de_pago: data['Payment Terms Code'] || '',
            departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
            documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
            institucional: data.CustomerName || '',
            metodo_de_pago_contado: data['Payment Method Code'] || '',
            monto_de_pedido: lastTransaction?.Net_Amount || data.Amount || 0,
            monto_despachado: lastTransaction?.Net_Amount || data.Amount || 0,
            monto_facturado: lastTransaction?.Net_Amount || data.Amount || 0,
            company: data.CustomerName || '',
            representante_legal: data.ContactName || '',
            responsable_de_compra: data['Job Responsibility Code'] || '',
        rtn: cleanRTN(data['VAT Registration No_']),
            segmento: normalizeSegmento(data.Segmento),
            status_de_cotizaciones: data.Status || '',
            status_del_pedido: data.Status || '',
            tipo_de_credito: data.CodigoTemporada || 'NORMAL',
            atributo_departamento: data['Attrib 2 Code'] || '',
            valor_de_cotizacion: lastTransaction?.Net_Amount || data.Amount || 0,
            motivo_de_la_cotizacion_perdida: '',
            motivo_de_la_cotizacion_anulada: '',
            unidad_de_negocio_dynamics: unidadDeNegocio1[data['Customer Posting Group']] || '',
            email: data.CustomerEmail || data.ContactEmail || '',
            rolfactura: data.RolFactura || '',
            entry_no: data['Entry No_'] || '',
            cust_ledger_entry: data['Entry No_'] || '',
            institucional: determinarTipoInstitucion(data.CustomerName)
        };
    }
};

// Mapeos específicos por tipo de caso para deals (negocios)
const dealMappings = {
    'mayoreo-tienda': (data, commonProps) => ({
        ...commonProps,
        categorizacion: data.Categoria_Contado || '',
        codigo_de_segmento: data.Cod_Segmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.Payment_Terms_Code || '',
        departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
        documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
        metodo_de_pago_contado: data.Payment_Method_Code || '',
        nombre_de_la_empresa: data.CustomerName || '',
        representante_legal: data.ContactName || '',
        responsable_de_compra: data.Job_Responsibility_Code || '',
        rtn: cleanRTN(data.VAT_Registration_No),
        segmento: normalizeSegmento(data.Segmento) || '',
        tipo_de_credito: data.CodigoTemporada || 'NORMAL',
        atributo_departamento: data.Attrib_2_Code || '',
        unidad_de_negocio_dynamics: unidadDeNegocio1[data.Customer_Posting_Group] || '',
        unidades_de_negocio_pacasa: unidadDeNegocio2[data.Customer_Posting_Group] || '',
        correo: data.CustomerEmail || data.ContactEmail || '',
        entry_no: data.Entry_No || '',
        cust_ledger_entry: data.Entry_No || '',
        codigo_de_factura: data.Document_No || '',
        id_de_cliente: data.CustomerNo || '',
        no__tienda: data.Store_No || '',
        monto_neto: data.Net_Amount || 0
    }),

    'cooperativa': (data, commonProps) => ({
        ...commonProps,
        categorizacion: data.Categoria_Contado || '',
        codigo_de_segmento: data.Cod_Segmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.Payment_Terms_Code || '',
        departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
        documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
        metodo_de_pago_contado: data.Payment_Method_Code || '',
        nombre_de_la_empresa: data.CustomerName || '',
        representante_legal: data.ContactName || '',
        responsable_de_compra: data.Job_Responsibility_Code || '',
        rtn: cleanRTN(data.VAT_Registration_No),
        segmento: normalizeSegmento(data.Segmento) || '',
        tipo_de_credito: data.CodigoTemporada || 'NORMAL',
        atributo_departamento: data.Attrib_2_Code || '',
        unidad_de_negocio_dynamics: unidadDeNegocio1[data.Customer_Posting_Group] || '',
        unidades_de_negocio_pacasa: unidadDeNegocio2[data.Customer_Posting_Group] || '',
        correo: data.CustomerEmail || data.ContactEmail || '',
        entry_no: data.Entry_No || '',
        cust_ledger_entry: data.Entry_No || '',
        codigo_de_factura: data.Document_No || '',
        id_de_cliente: data.CustomerNo || '',
        no__tienda: data.Store_No || '',
        monto_neto: data.Net_Amount || 0
    }),

    'licitacion': (data, commonProps) => ({
        ...commonProps,
        categorizacion: data.Categoria_Contado || '',
        codigo_de_segmento: data.Cod_Segmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.Payment_Terms_Code || '',
        departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
        documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
        institucional: data.CustomerName || '',
        metodo_de_pago_contado: data.Payment_Method_Code || '',
        monto_de_pedido: data.Amount || 0,
        monto_despachado: data.Amount || 0,
        monto_facturado: data.Amount || 0,
        nombre_de_la_empresa: data.CustomerName || '',
        representante_legal: data.ContactName || '',
        responsable_de_compra: data.Job_Responsibility_Code || '',
        rtn: cleanRTN(data.VAT_Registration_No),
        segmento: normalizeSegmento(data.Segmento) || '',
        status_de_cotizaciones: data.Status || '',
        status_del_pedido: data.Status || '',
        tipo_de_credito: data.CodigoTemporada || 'NORMAL',
        atributo_departamento: data.Attrib_2_Code || '',
        valor_de_cotizacion: data.Amount || 0,
        motivo_de_la_cotizacion_perdida: '',
        motivo_de_la_cotizacion_anulada: '',
        unidad_de_negocio_dynamics: unidadDeNegocio1[data.Customer_Posting_Group] || '',
        unidades_de_negocio_pacasa: unidadDeNegocio2[data.Customer_Posting_Group] || '',
        correo: data.CustomerEmail || data.ContactEmail || '',
        rolfactura: data.RolFactura || '',
        entry_no: data.Entry_No || '',
        cust_ledger_entry: data.Entry_No || '',
        institucional: determinarTipoInstitucion(data.CustomerName)
    })
};

// Función para mapear propiedades de contacto
const mapContactProperties = (data, tipoCaso) => {
    console.log('\nMapeando propiedades para contacto:', {
        tipoCaso,
        email: data.CustomerEmail || data.ContactEmail,
        name: data.CustomerName || data.ContactName
    });

    const commonProperties = {
        email: data.CustomerEmail || data.ContactEmail,
        firstname: data.CustomerName || data.ContactName,
        company: data.CustomerName
    };

    const mappingFunction = contactMappings[tipoCaso];
    const properties = mappingFunction ? mappingFunction(data, commonProperties) : commonProperties;
    
    console.log('Propiedades mapeadas:', properties);
    return properties;
};

// Función simplificada para mapear propiedades de deals
const mapDealProperties = (data, pipeline, dealstage, tipoCaso) => {
    
    const commonProperties = {
        dealname: data.CustomerName,
        pipeline: String(pipeline),
        dealstage: String(dealstage)
    };

    const mappingFunction = dealMappings[tipoCaso];
    return mappingFunction ? mappingFunction(data, commonProperties) : commonProperties;
};

// Función para crear o actualizar un contacto en HubSpot
const createOrUpdateContact = async (properties) => {
    try {
        const email = properties.email;
        if (!email) {
            console.log('No se puede crear/actualizar contacto sin email');
            return null;
        }

        // Buscar si el contacto existe
        const existingContact = await getContactByEmail(email);

        if (existingContact) {
            // Actualizar contacto existente
            console.log(`Actualizando contacto existente: ${email}`);
            const updated = await hubspotClient.crm.contacts.basicApi.update(
                existingContact.id,
                { properties }
            );
            return existingContact.id;
        } else {
            // Crear nuevo contacto
            console.log(`Creando nuevo contacto: ${email}`);
            const created = await hubspotClient.crm.contacts.basicApi.create({
                properties
            });
            return created.id;
        }
    } catch (error) {
        console.error('Error en createOrUpdateContact:', error);
        if (error.message.includes('RATE_LIMIT')) {
            await delay(2000);
            return createOrUpdateContact(properties); // Reintentar
        }
        return null;
    }
};

// Función para obtener un contacto por email
const getContactByEmail = async (email) => {
    try {
        const response = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [{
                filters: [{
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email
                }]
            }]
        });
        return response.results[0];
    } catch (error) {
        console.error('Error buscando contacto:', error);
        if (error.message.includes('RATE_LIMIT')) {
            await delay(2000);
            return getContactByEmail(email); // Reintentar
        }
        return null;
    }
};

// Función para dividir un array en chunks
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const validateAndFixContacts = (contacts) => {
    const validContacts = [];

    for (const contact of contacts) {
        // Validar contacto
        const missingFields = validateContact(contact);
        if (missingFields.length > 0) {
            console.log(`Contacto inválido. Faltan las siguientes propiedades: ${missingFields.join(', ')}`);
            continue;
        }

        // Obtener y validar el email (usando CustomerEmail o ContactEmail)
        const email = fixAndValidateEmail(contact.CustomerEmail) || fixAndValidateEmail(contact.ContactEmail);

        if (!email) {
            console.log('No se encontró un email válido para el contacto');
            continue;
        }

        // Actualizar el email en el objeto del contacto
        contact.CustomerEmail = email; // Mantener consistencia con la estructura de datos

        // Agregar a la lista de contactos válidos
        validContacts.push(contact);
    }

    return validContacts;
};

const filterDuplicates = (contacts) => {
    const uniqueContactsMap = new Map();

    for (const contact of contacts) {
        const email = contact.CustomerEmail?.toLowerCase(); // Normaliza el email para evitar duplicados insensibles a mayúsculas
        if (!email) continue;

        // Si ya existe un contacto con el mismo email, se ignora el duplicado
        if (!uniqueContactsMap.has(email)) {
            uniqueContactsMap.set(email, contact);
        }
    }

    // Devuelve solo los contactos únicos
    return Array.from(uniqueContactsMap.values());
};

const filterDuplicatesName = (contacts) => {
    const uniqueContactsMap = new Map();

    for (const contact of contacts) {
        const name = contact.CustomerName?.toLowerCase(); // Normaliza el name para evitar duplicados insensibles a mayúsculas
        if (!name) continue;

        // Si ya existe un contacto con el mismo name, se ignora el duplicado
        if (!uniqueContactsMap.has(name)) {
            uniqueContactsMap.set(name, contact);
        }
    }

    // Devuelve solo los contactos únicos
    return Array.from(uniqueContactsMap.values());
};

// Determina el pipeline y el dealstage basado en CustomerPostingGroup
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
            return null;
    }
};

// Modificar el createDealPayload para manejar los nuevos datos
const createDealPayload = (dealData, pipeline, dealstage, contactId, tipoCaso) => {
    const commonProperties = {
        dealname: dealData.CustomerName,
        pipeline: String(pipeline),
        dealstage: String(dealstage)
    };

    const mappingFunction = dealMappings[tipoCaso];
    const specificProperties = mappingFunction ? mappingFunction(dealData, commonProperties) : commonProperties;

    const associations = contactId ? [{
            types: [{
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 3,
            }],
                to: { id: contactId },
    }] : [];

    return { 
        properties: specificProperties, 
        associations 
    };
};

// Modificar la función processDeal para incluir el tipo de caso
const processDeal = async (dealData, contactIdMap) => {
    const pipelineAndDealstage = getPipelineAndDealstage(dealData.CustomerPostingGroup);
    if (!pipelineAndDealstage) return null;

    const { pipeline, dealstage } = pipelineAndDealstage;
    const dealName = dealData.Name || '';

    const isUnique = await isDealUnique(dealName);
    if (!isUnique) return null;

    const email = fixAndValidateEmail(dealData.CustomerEmail) || fixAndValidateEmail(dealData.ContactEmail);
    const contactId = contactIdMap[email];

    if (!contactId) {
        console.log(`No se encontró un contacto para el email: ${email}`);
        return null;
    }

    // Determinar el tipo de caso aquí
    const tipoCaso = determinarTipoCaso(dealData);
    return createDealPayload(dealData, pipeline, dealstage, contactId, tipoCaso);
};

// Funciones auxiliares para procesar batches
const processBatchCreation = async (requests) => {
    if (requests.length === 0) return;
    
    try {
        console.log(`Creando ${requests.length} contactos en batch.`);
        await hubspotClient.crm.contacts.batchApi.create({ inputs: requests });
    } catch (error) {
        handleBatchError(error, 'creación');
    }
};

const processBatchUpdate = async (requests) => {
    if (requests.length === 0) return;
    
    try {
        console.log(`Actualizando ${requests.length} contactos en batch.`);
        await hubspotClient.crm.contacts.batchApi.update({ inputs: requests });
    } catch (error) {
        handleBatchError(error, 'actualización');
    }
};

const handleBatchError = (error, operationType) => {
    if (error.response?.status === 409) {
        console.warn(`Duplicados detectados en ${operationType} de contactos. Continuando con el siguiente batch.`);
    } else {
        console.error(`Error en ${operationType} por batch:`, error);
    }
};

// Función simplificada
const processContactsBatch = async (contacts) => {
    console.log('Procesando batch de contactos:', contacts.length);
    const uniqueContacts = filterDuplicates(contacts);
    console.log(`Total de contactos únicos después del filtro: ${uniqueContacts.length}`);

    const chunks = chunkArray(uniqueContacts, 100);
    for (const chunk of chunks) {
        const { createRequests, updateRequests } = await segregateContacts(chunk);
        await Promise.all([
            processBatchCreation(createRequests),
            processBatchUpdate(updateRequests)
        ]);
    }
};

const segregateContacts = async (contacts) => {
        const createRequests = [];
        const updateRequests = [];

    for (const contact of contacts) {
            const existingContact = await getContactByEmail(contact.CustomerEmail);
        const properties = mapContactProperties(contact, determinarTipoCaso(contact));

            if (existingContact) {
                updateRequests.push({ id: existingContact.id, properties });
            } else {
                createRequests.push({ properties });
            }
        }

    return { createRequests, updateRequests };
};

// Función auxiliar para generar email basado en RTN o DNI
const generateEmail = (contact) => {
    // Emails que indican que no tiene correo
    const noEmailList = ['notiene@pacasa.hn', 'notiene@gmail.com'];
    const email = contact.CustomerEmail || contact.ContactEmail || contact.MemberEmail;

    // Si no hay email o no es uno de los "notiene", retornar el email original
    if (!email || !noEmailList.includes(email.toLowerCase())) {
        return email;
    }

    // Solo si el email es "notiene@", generar uno basado en RTN o DNI
    // Limpiar y validar RTN
    const rtn = cleanRTN(contact.VAT_Registration_No || contact.VATRegistrationNo);
    if (rtn) {
        // Mantener el mismo dominio que tenía el email original
        const domain = email.includes('pacasa.hn') ? 'pacasa.hn' : 'gmail.com';
        return `${rtn}@${domain}`;
    }

    // Si no hay RTN, usar DNI/ContactNo
    const dni = contact.ContactNo || contact.DNI;
    if (dni) {
        // Mantener el mismo dominio que tenía el email original
        const domain = email.includes('pacasa.hn') ? 'pacasa.hn' : 'gmail.com';
        return `${dni}@${domain}`;
    }

    // Si no hay ni RTN ni DNI, retornar el email original
    return email;
};

// Modificar la función processContacts para usar la nueva función
const processContacts = async (contacts) => {
    console.log('Iniciando procesamiento de contactos...');
    
    for (const contact of contacts) {
        try {
            // Generar email correcto
            const correctedEmail = generateEmail(contact);
            if (!correctedEmail) {
                console.log('Saltando contacto sin identificación válida para generar email');
                continue;
            }

            // Actualizar el email en el contacto
            contact.CustomerEmail = correctedEmail;
            contact.ContactEmail = correctedEmail;
            contact.MemberEmail = correctedEmail;

            // Validación específica para contactos de fidelidad
            if (contact.MemberClub === 'FIDELIDAD') {
                if (!contact.MemberName || !contact.PhoneNo || !contact.ContactNo) {
                    console.log('Saltando contacto de fidelidad con campos obligatorios faltantes:', {
                        nombre: contact.MemberName || 'FALTA',
                        email: correctedEmail,
                        telefono: contact.PhoneNo || 'FALTA',
                        dni: contact.ContactNo || 'FALTA'
                    });
                    continue;
                }
                await createOrUpdateContact(mapContactProperties(contact, 'fidelidad'));
                continue;
            }

            // Resto de la validación existente para otros tipos
            const customerPostingGroup = contact.Customer_Posting_Group || contact.CustomerPostingGroup;
            console.log('Procesando contacto con Customer Posting Group:', customerPostingGroup);

            switch (customerPostingGroup) {
                case 'CLIENTEEXP':
                case 'CLIENTESPS':
                case 'CLIENTETDA':
                case 'CLIENTETGU':
                    await processContactAndDeal(contact, 'mayoreo-tienda');
                    break;
                case 'CLIENTELIC':
                    // await processContactAndDeal(contact, 'licitacion');
                    break;
                default:
                    console.log('Saltando contacto con Customer_Posting_Group no válido:', JSON.stringify(customerPostingGroup, null, 2));
                    continue;
            }
        } catch (error) {
            console.error('Error procesando contacto:', error);
            continue;
        }
    }
};

// Función para realizar un retraso entre las solicitudes
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para obtener el negocio por nombre
const getDealByName = async (dealName) => {
    if (!dealName) {
        console.log('Nombre de deal inválido');
        return false;
    }

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
            await delay(2000);
            return getDealByName(dealName);
        }
        console.error('Error buscando negocio:', error);
        return false;
    }
};

// Valida si el negocio es único (no duplicado)
const isDealUnique = async (dealName) => {

    const existingDeal = await getDealByName(dealName);

    if (existingDeal) {
        console.log(`El negocio "${dealName}" ya existe. No se creará un duplicado.`);
        return false;
    }
    return true;
};

// Procesa un negocio individual
const createDealsBatch = async (batch, contactIdMap) => {
    const uniqueDeals = filterDuplicatesName(batch);

    try {
        const dealsPayload = await Promise.all(
            uniqueDeals.map((dealData) => processDeal(dealData, contactIdMap))
        );

        const validDeals = dealsPayload.filter(Boolean);

        if (validDeals.length > 0) {
            const batchRequest = { inputs: validDeals };
            await hubspotClient.crm.deals.batchApi.create(batchRequest);
        } else {
            console.log('No hay negocios válidos en este batch.');
        }
    } catch (error) {
        console.error('Error procesando batch de negocios:', error.message);
    }
};


// Procesar todos los negocios por lotes
const createDeals = async (allDeals, contactIdMap) => {
    console.log("contactIdMap: ", contactIdMap);

    const chunks = chunkArray(allDeals, 100);
    for (const chunk of chunks) {
        await createDealsBatch(chunk, contactIdMap);
    }
};

const validateDeal = (contact) => {
    const missingFields = [];
    if (!contact.Customer_Posting_Group) missingFields.push('Customer_Posting_Group');
    if (!contact.CustomerEmail && !contact.ContactEmail) missingFields.push('CustomerEmail');
    if (!contact.CustomerName && !contact.ContactName) missingFields.push('CustomerName');
    if (!contact.Segmento) missingFields.push('Segmento');

    return missingFields;
};

const validateContact = (contact) => {
    const missingFields = [];
    
    // Log detallado del contacto con validación de campos
    console.log('\nDatos completos del contacto:', {
        ...contact,
        VAT_Registration_No: contact.VAT_Registration_No || 'No disponible'
    });
    
    // Intentar validar y corregir el email
    const validEmail = fixAndValidateEmail(contact.CustomerEmail) || fixAndValidateEmail(contact.ContactEmail);
    
    if (!validEmail) {
        missingFields.push('CustomerEmail');
        console.log('⚠️ No se encontró ningún email válido');
    } else {
        console.log('✅ Email válido encontrado:', validEmail);
    }
    
    if (!contact.CustomerName && !contact.ContactName) {
        missingFields.push('CustomerName');
        console.log('⚠️ No se encontró ningún nombre válido');
    } else {
        console.log('✅ Nombre válido encontrado:', contact.CustomerName || contact.ContactName);
    }

    return missingFields;
};

const processContactForDeal = async (contact, contactIdMap) => {
    try {
        const email = fixAndValidateEmail(contact.CustomerEmail) || fixAndValidateEmail(contact.ContactEmail);
        const contactName = (contact.CustomerName || contact.ContactName)?.trim();
    
    if (!email || !contactName) {
        console.log(`Saltando contacto inválido: email=${email}, nombre=${contactName}`);
        return null;
    }

        /* Temporalmente comentado para pruebas de fidelidad
        // Validar el tipo de caso y Customer_Posting_Group
        const tipoCaso = determinarTipoCaso(contact);
        if (!tipoCaso) {
            console.log('No se pudo determinar el tipo de caso para el contacto');
        return null;
    }

        // Si es CLIENTELIC, solo crear el contacto y no el deal
        if (contact.CustomerPostingGroup === 'CLIENTELIC') {
            console.log(`Cliente de licitación detectado (${contactName}), solo se creará el contacto`);
            const tipoCaso = 'licitacion';
            await createOrUpdateContact(mapContactProperties(contact, tipoCaso));
        return null;
    }
        */

        // Para pruebas de fidelidad, asumimos que todos son tipo 'fidelidad'
        const tipoCaso = 'fidelidad';

        // Buscar o crear el contacto
        let existingContact = await getContactByEmail(email);
        let contactId;
        
        if (!existingContact?.id) {
            console.log(`Creando nuevo contacto para email: ${email}`);
            // Crear el contacto
            contactId = await createOrUpdateContact(mapContactProperties(contact, tipoCaso));
            if (!contactId) {
                console.log('No se pudo crear el contacto');
                return null;
            }
        } else {
            contactId = existingContact.id;
        }

        // Validar campos necesarios para el deal
    const missingDealFields = validateDeal(contact);
    if (missingDealFields.length > 0) {
        console.log(`Negocio inválido para contacto. Faltan: ${missingDealFields.join(', ')}`);
        return null;
    }

        // Obtener pipeline y dealstage
        const pipelineInfo = getPipelineAndDealstage(contact.Customer_Posting_Group);
        if (!pipelineInfo) {
            console.log('No se pudo determinar el pipeline para el contacto');
            return null;
        }

        // Crear el deal
        const dealProperties = dealMappings[tipoCaso](contact, {
            dealname: contactName,
            pipeline: pipelineInfo.pipeline.toString(),
            dealstage: pipelineInfo.dealstage.toString()
        });

        const dealData = {
            properties: dealProperties,
            associations: [{
                to: {
                    id: contactId
                },
                types: [{
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 3
                }]
            }]
        };

        // Guardar el ID del contacto en el mapa
        contactIdMap[email] = contactId;

        console.log(`Preparado deal para contacto ${contactName} (${email})`);
        return dealData;
    } catch (error) {
        console.error('Error en processContactForDeal:', error);
        return null;
    }
};

const processContactAndDeal = async (contact, tipoCaso) => {
    try {
        // Validar que tipoCaso sea válido
        const validTipoCasos = ['mayoreo-tienda', 'cooperativa', 'licitacion'];
        if (!validTipoCasos.includes(tipoCaso)) {
            console.error(`Tipo de caso inválido: ${tipoCaso}, saltando contacto`);
            return; // No procesar este contacto
        }

        const contactId = await createOrUpdateContact(mapContactProperties(contact, tipoCaso));
        
        if (!contactId) {
            console.log('No se pudo crear/actualizar el contacto');
            return;
        }

        // Obtener pipeline y dealstage según el CustomerPostingGroup
        const pipelineInfo = getPipelineAndDealstage(contact.Customer_Posting_Group);
        if (!pipelineInfo) {
            console.log('No se pudo determinar el pipeline para el contacto');
            return;
        }

        // Verificar que el mapeo existe
        if (typeof dealMappings[tipoCaso] !== 'function') {
            console.error(`No se encontró mapeo para el tipo de caso: ${tipoCaso}`);
            return;
        }

        // Usar el mapeo de deals existente para obtener todas las propiedades
        const dealProperties = dealMappings[tipoCaso](contact, {
            dealname: contact.CustomerName || 'Sin Nombre',
            pipeline: pipelineInfo.pipeline.toString(),
            dealstage: pipelineInfo.dealstage.toString()
        });

        // Crear estructura del deal con todas las propiedades mapeadas
        const dealData = {
            properties: dealProperties,
            associations: [
                {
                    to: {
                        id: contactId
                    },
                    types: [
                        {
                            associationCategory: "HUBSPOT_DEFINED",
                            associationTypeId: 3
                        }
                    ]
                }
            ]
        };

        console.log('Estructura del deal a crear:', JSON.stringify(dealData, null, 2));
        await createDeal(dealData);
    } catch (error) {
        console.error('Error en processContactAndDeal:', error);
        throw error;
    }
};

const createDeal = async (dealData, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos

    try {
        if (!hubspotClient?.crm?.deals?.basicApi) {
            throw new Error('Cliente de HubSpot no inicializado correctamente');
        }

        // Validar estructura mínima requerida
        if (!dealData.properties || !dealData.properties.dealname) {
            throw new Error('Estructura de deal inválida: falta dealname');
        }

        console.log('Intentando crear deal:', dealData.properties.dealname);
        const created = await hubspotClient.crm.deals.basicApi.create(dealData);
        console.log('Deal creado exitosamente:', created);
        return created.id;
    } catch (error) {
        console.error(`Error creando deal (intento ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

        // Si es un error de conexión o rate limit y no hemos excedido los reintentos
        if ((error.code === 'ECONNRESET' || error.message.includes('RATE_LIMIT')) && retryCount < MAX_RETRIES) {
            console.log(`Reintentando en ${RETRY_DELAY/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createDeal(dealData, retryCount + 1);
        }

        // Si hemos agotado los reintentos o es otro tipo de error
        throw new Error(`Error final creando deal después de ${retryCount + 1} intentos: ${error.message}`);
    }
};

// Mantener la función deals original
const deals = async () => {
    try {
        const startDate = getLast24HoursDate();
        console.log('\n=== Procesando Deals ===');
        console.log('Rango de fechas para deals:');
        console.log('- Desde:', startDate);
        console.log('- Hasta:', new Date().toISOString());
        console.log('=====================\n');
        
        // Actualizar los endpoints para incluir todos los tipos
        const endpoints = {
            'mayoreo-tienda': 'unified-v6',
            'cooperativa': 'cooperativa-v6',
            'fidelidad': 'fidelidad-v6'
        };
        
        const contactIdMap = {};
        const validDeals = [];

        // Iterar sobre todos los endpoints
        for (const [tipo, endpoint] of Object.entries(endpoints)) {
            console.log(`Procesando ${tipo} desde endpoint ${endpoint}`);
            
            const { data } = await axios.get(`${config.dynamicsApiBase}/${endpoint}`, {
                params: { startDate }
            });

            if (data.results && Array.isArray(data.results)) {
                console.log(`Encontrados ${data.results.length} registros en ${endpoint}`);
                
                for (const contact of data.results) {
                    try {
                        // Para fidelidad, solo crear contacto sin deal
                        if (tipo === 'fidelidad') {
                            await createOrUpdateContact(mapContactProperties(contact, tipo));
                            continue;
                        }

                    const dealData = await processContactForDeal(contact, contactIdMap);
                        if (dealData) {
                            console.log(`Deal válido encontrado para ${contact.CustomerName}`);
                            validDeals.push(dealData);
                        }
                } catch (error) {
                        console.error(`Error procesando contacto: ${contact.CustomerEmail}`, error);
                }
                }
            } else {
                console.log(`No se encontraron resultados en ${endpoint}`);
            }
        }

        if (validDeals.length > 0) {
            console.log(`Creando ${validDeals.length} deals válidos`);
            await createDeals(validDeals, contactIdMap);
                console.log('Negocios creados exitosamente.');
        } else {
            console.log('No hay negocios válidos para procesar.');
        }
    } catch (error) {
        console.error('Error procesando deals:', error);
        if (error.response) {
            console.error('Detalles del error:', {
                status: error.response.status,
                data: error.response.data,
                endpoint: error.config.url
            });
        }
    }
};

// Función principal que ejecuta todo el proceso
const executeFullSync = async () => {
    console.log('\n=== Iniciando sincronización completa ===');
    console.log('Fecha y hora de inicio:', new Date().toISOString());
    const startDate = getLast24HoursDate();
    console.log('Rango de fechas:');
    console.log('- Desde:', startDate);
    console.log('- Hasta:', new Date().toISOString());
    console.log('=====================================\n');
    
    try {
        // Obtener datos de todos los endpoints
        const { data: mayoreoResponse } = await axios.get(`http://localhost:3000/api/test/unified-v6`, {
            params: { startDate }
        });
        
        const { data: cooperativaResponse } = await axios.get(`http://localhost:3000/api/test/cooperativa-v6`, {
            params: { startDate }
        });

        const { data: licitacionResponse } = await axios.get(`http://localhost:3000/api/test/licitacion-v6`, {
            params: { startDate }
        });

        const { data: fidelidadResponse } = await axios.get(`http://localhost:3000/api/test/fidelidad-v6`, {
            params: { startDate }
        });

        // Mostrar análisis
        console.log('\nAnálisis mayoreo:', mayoreoResponse.analysis);
        console.log('\nAnálisis cooperativa:', cooperativaResponse.analysis);
        console.log('\nAnálisis licitación:', licitacionResponse.analysis);
        console.log('\nAnálisis fidelidad:', fidelidadResponse.analysis);

        // Combinar resultados
        const allContacts = [
            ...(mayoreoResponse.results || []), 
            ...(cooperativaResponse.results || []),
            ...(licitacionResponse.results || []),
            ...(fidelidadResponse.results || [])
        ];

        if (allContacts.length === 0) {
            console.log('No se encontraron contactos para procesar');
            return;
        }

        // Procesar contactos y deals
        await processContacts(allContacts);
        await deals();
        
        console.log('Sincronización completa finalizada');
    } catch (error) {
        console.error('Error en la sincronización:', error);
    }
};

// Ejecutar inmediatamente al iniciar
executeFullSync();

// Programar la ejecución cada 24 horas
cron.schedule('0 0 * * *', executeFullSync);
