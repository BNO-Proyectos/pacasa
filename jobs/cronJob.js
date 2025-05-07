const cron = require('node-cron');
const { executeFullSync } = require('../src/services/hubspot/sync');

const initializeCronJobs = () => {
    // Ejecutar inmediatamente al iniciar
    executeFullSync();

    // Programar la ejecución cada 24 horas
    cron.schedule('0 0 * * *', executeFullSync);
};

module.exports = {
    initializeCronJobs
};