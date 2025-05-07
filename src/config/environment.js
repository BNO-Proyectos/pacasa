require('dotenv').config();

module.exports = {
    database: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    },
    hubspot: {
        accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
        apiBase: 'http://localhost:3000/api/test',
        apiEndpointDealsBase: 'http://localhost:3000/api/test'
    },
    server: {
        port: 3000
    }
};