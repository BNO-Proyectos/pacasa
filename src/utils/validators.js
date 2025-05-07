const generateEmail = (contact) => {
    const noEmailList = ['notiene@pacasa.hn', 'notiene@gmail.com', 'notiene@hotmail.com'];
    const email = contact.CustomerEmail || contact.ContactEmail || contact.MemberEmail;

    // Verificar si el email comienza con 'notiene@' o está en la lista
    if (!email || email.toLowerCase().startsWith('notiene@') || noEmailList.includes(email.toLowerCase())) {
        // Intentar generar email con RTN
        const rtn = cleanRTN(contact.VAT_Registration_No || contact.VATRegistrationNo);
        if (rtn) {
            const domain = 'pacasa.hn';
            return `${rtn}@${domain}`;
        }

        // Si no hay RTN, intentar con DNI/ContactNo
        const dni = contact.ContactNo || contact.DNI;
        if (dni) {
            const domain = 'pacasa.hn';
            return `${dni}@${domain}`;
        }
    }

    return email;
};

const filterDuplicates = (contacts) => {
    const uniqueContactsMap = new Map();
    for (const contact of contacts) {
        const email = contact.CustomerEmail?.toLowerCase();
        if (!email) continue;
        if (!uniqueContactsMap.has(email)) {
            uniqueContactsMap.set(email, contact);
        }
    }
    return Array.from(uniqueContactsMap.values());
};

const filterDuplicatesName = (contacts) => {
    const uniqueContactsMap = new Map();
    for (const contact of contacts) {
        const name = contact.CustomerName?.toLowerCase();
        if (!name) continue;
        if (!uniqueContactsMap.has(name)) {
            uniqueContactsMap.set(name, contact);
        }
    }
    return Array.from(uniqueContactsMap.values());
};

const fixAndValidateEmail = (email) => {
    // Log para depuración
    console.log('Validando email:', email);

    // Si no hay email, retornar null
    if (!email || !email.includes('@')) {
        console.log(`Email inválido o vacío: ${email}`);
        return null;
    }

    const [localPart, domain] = email.split('@');

    // Mapeo de correcciones de dominio
    const domainCorrections = {
        // Dominios sin punto
        'yahooes': 'yahoo.es',
        'yahoocom': 'yahoo.com',
        'gmailcom': 'gmail.com',
        'hotmailcom': 'hotmail.com',
        'outlookcom': 'outlook.com',
        'pacasahn': 'pacasa.hn',
        // Dominios sin TLD
        'yahoo': 'yahoo.com',
        'gmail': 'gmail.com',
        'hotmail': 'hotmail.com',
        'outlook': 'outlook.com',
        'pacasa': 'pacasa.hn',
        // Dominios con TLD sin punto
        'comhn': '.com.hn',
        'orghn': '.org.hn'
    };

    // Validar que el dominio no comience con un punto
    if (domain.startsWith('.')) {
        console.log('Dominio inválido: comienza con punto');
        return null;
    }

    // Aplicar correcciones al dominio
    let correctedDomain = domain;
    
    // Si el dominio está en nuestro mapeo, usar la corrección
    if (domainCorrections[domain.toLowerCase()]) {
        correctedDomain = domainCorrections[domain.toLowerCase()];
    } 
    // Si no tiene punto, intentar agregar el punto en el lugar correcto
    else if (!domain.includes('.')) {
        // Patrones comunes de dominios sin punto
        const patterns = {
            'com$': '.com',
            'es$': '.es',
            'hn$': '.hn',
            'net$': '.net',
            'org$': '.org'
        };

        for (const [pattern, correction] of Object.entries(patterns)) {
            const regex = new RegExp(pattern);
            if (regex.test(domain)) {
                correctedDomain = domain.replace(regex, correction);
                break;
            }
        }
    }

    const correctedEmail = `${localPart}@${correctedDomain}`;

    // Validar formato final del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correctedEmail)) {
        console.log(`Email con formato inválido después de correcciones: ${correctedEmail}`);
        return null;
    }

    console.log('Email validado y corregido:', correctedEmail);
    return correctedEmail.toLowerCase();
};

const cleanRTN = (rtn) => {
    if (!rtn) return '';
    return rtn.replace(/\D/g, '');
};

module.exports = {
    generateEmail,
    filterDuplicates,
    filterDuplicatesName,
    fixAndValidateEmail,
    cleanRTN
};
