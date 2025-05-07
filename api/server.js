const express = require('express');
const dynamicsEndpoints = require('../src/services/dynamics/endpoints');
const config = require('../src/config/environment');

const app = express();

// Rutas
app.use('/api/test', dynamicsEndpoints);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;