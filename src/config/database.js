const sql = require('mssql');
const config = require('./environment');

const poolPromise = sql.connect(config.database)
    .then(pool => {
        console.log("Conexión a la base de datos establecida");
        return pool;
    })
    .catch(err => {
        console.error("Error conectando a la base de datos:", err);
        process.exit(1);
    });

const executeQuery = async (query) => {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset;
};

module.exports = {
    poolPromise,
    executeQuery
};