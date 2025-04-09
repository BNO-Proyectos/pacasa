require('dotenv').config();

const express = require('express');
const sql = require('mssql');

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const app = express();
const port = 3000;

// Inicializar conexión a la base de datos
const poolPromise = sql.connect(dbConfig)
    .then(pool => {
        console.log("Conexión a la base de datos establecida");
        return pool;
    })
    .catch(err => {
        console.error("Error conectando a la base de datos:", err);
        process.exit(1);
    });

// Función para ejecutar consultas
const executeQuery = async (query) => {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset;
};

// 1. Endpoint para Mayoreo-Tienda
app.get('/api/test/unified-v6', async (req, res) => {
    const { startDate } = req.query;
    if (!startDate) {
        return res.status(400).json({ error: "El parámetro 'startDate' es obligatorio." });
    }
    
    try {
        const mainQuery = `
            WITH ClientesBase AS (
            SELECT DISTINCT
                c.[Categoria Contado],
                c.[Cod Segmento],
                c.[No_] AS CustomerNo, 
                c.[Payment Terms Code],
                c.[Post Code],
                c.[CalificacionCrediticia],
                c.[Payment Method Code],
                c.[Name] AS CustomerName,
                c.[VAT Registration No_],
                c.[Segmento],
                c.[Customer Posting Group],
                    c.[Customer Price Group],
                    c.[E-Mail] AS CustomerEmail,
                    cont.[Name] AS ContactName,
                    cont.[E-Mail] AS ContactEmail,
                    cjr.[Job Responsibility Code],
                    tc.[Id Temporada],
                    cle.[Entry No_],
                    dcle.[Document No_]
                FROM [dbo].[PACASA$Customer] c
                LEFT JOIN [dbo].[PACASA$Contact] cont 
                    ON c.[No_] = cont.[Company No_]
                LEFT JOIN [dbo].[PACASA$Contact Job Responsibility] cjr 
                    ON cont.[No_] = cjr.[Contact No_]
                LEFT JOIN [dbo].[PACASA$Temporadas Clientes] tc 
                    ON c.[No_] = tc.[Customer No_]
                LEFT JOIN [PACASA$Cust_ Ledger Entry] cle 
                    ON c.[No_] = cle.[Customer No_]
                LEFT JOIN [PACASA$Detailed Cust_ Ledg_ Entry] dcle 
                    ON cle.[Entry No_] = dcle.[Cust_ Ledger Entry No_]
                WHERE c.[Customer Price Group] = 'MAYORISTA'
                AND CONVERT(DATE, c.[Date Created]) >= '${startDate}'
            )
            SELECT 
                cb.*,
                th.[Receipt No_],
                th.[Store No_],
                tse.[Net Amount],
                i.[Attrib 2 Code],
                i.[Description] AS ItemDescription
            FROM ClientesBase cb
            LEFT JOIN [dbo].[PACASA$Transaction Header] th 
                ON cb.CustomerNo = th.[Customer No_]
            LEFT JOIN [dbo].[PACASA$Trans_ Sales Entry] tse 
                ON th.[Receipt No_] = tse.[Receipt No_]
                AND th.[Store No_] = tse.[Store No_]
            LEFT JOIN [dbo].[PACASA$Item] i 
                ON tse.[Item No_] = i.[No_]
        `;

        const results = await executeQuery(mainQuery);
        
        // Agrupar los resultados por cliente
        const groupedResults = results.reduce((acc, curr) => {
            const key = curr.CustomerNo;
            
            if (!acc[key]) {
                
                acc[key] = {
                    CustomerNo: curr.CustomerNo,
                    CustomerName: curr.CustomerName,
                    Categoria_Contado: curr['Categoria Contado'],
                    Cod_Segmento: curr['Cod Segmento'],
                    Payment_Terms_Code: curr['Payment Terms Code'],
                    Post_Code: curr['Post Code'],
                    CalificacionCrediticia: curr.CalificacionCrediticia,
                    Payment_Method_Code: curr['Payment Method Code'],
                    VAT_Registration_No: curr['VAT Registration No_'],
                    Segmento: curr.Segmento,
                    Customer_Posting_Group: curr['Customer Posting Group'],
                    CustomerEmail: curr.CustomerEmail,
                    ContactName: curr.ContactName,
                    ContactEmail: curr.ContactEmail,
                    Job_Responsibility_Code: curr['Job Responsibility Code'],
                    CodigoTemporada: curr['Id Temporada'] || '',
                    Entry_No: curr['Entry No_'],
                    Document_No: curr['Document No_'],
                    Customer_Price_Group: curr['Customer Price Group'],
                    transacciones: []
                };
            }
            
            // Si hay datos de transacción, agregarlos al array
            if (curr['Receipt No_']) {
                acc[key].transacciones.push({
                    Receipt_No: curr['Receipt No_'],
                    Store_No: curr['Store No_'],
                    Net_Amount: curr['Net Amount'],
                    Attrib_2_Code: curr['Attrib 2 Code'],
                    ItemDescription: curr.ItemDescription
                });
            }
            
            return acc;
        }, {});

        const finalResults = Object.values(groupedResults);
        
        res.json({
            analysis: {
                totalClientes: finalResults.length,
                clientesConTransacciones: finalResults.filter(c => c.transacciones.length > 0).length,
                totalTransacciones: finalResults.reduce((sum, c) => sum + c.transacciones.length, 0)
            },
            results: finalResults
        });
    } catch (error) {
        console.error("Error en consulta mayoreo-tienda:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Endpoint para Cooperativa
app.get('/api/test/cooperativa-v6', async (req, res) => {
    const { startDate } = req.query;
    if (!startDate) {
        return res.status(400).json({ error: "El parámetro 'startDate' es obligatorio." });
    }
    
    try {
        const mainQuery = `
            WITH ClientesBase AS (
                SELECT DISTINCT
                    c.[Categoria Contado],
                    c.[Cod Segmento],
                    c.[No_] AS CustomerNo,
                    c.[Payment Terms Code],
                    c.[Post Code],
                    c.[CalificacionCrediticia],
                    c.[Payment Method Code],
                    c.[Name] AS CustomerName,
                    c.[VAT Registration No_],
                    c.[Segmento],
                    c.[Customer Posting Group],
                    c.[Customer Price Group],
                    c.[E-Mail] AS CustomerEmail,
                    cont.[Name] AS ContactName,
                    cont.[E-Mail] AS ContactEmail,
                    cjr.[Job Responsibility Code],
                    tc.[Id Temporada],
                    cle.[Entry No_],
                    dcle.[Document No_]
                FROM [dbo].[PACASA$Customer] c
                LEFT JOIN [dbo].[PACASA$Contact] cont 
                    ON c.[No_] = cont.[Company No_]
                LEFT JOIN [dbo].[PACASA$Contact Job Responsibility] cjr 
                    ON cont.[No_] = cjr.[Contact No_]
                LEFT JOIN [dbo].[PACASA$Temporadas Clientes] tc 
                    ON c.[No_] = tc.[Customer No_]
                LEFT JOIN [PACASA$Cust_ Ledger Entry] cle 
                    ON c.[No_] = cle.[Customer No_]
                LEFT JOIN [PACASA$Detailed Cust_ Ledg_ Entry] dcle 
                    ON cle.[Entry No_] = dcle.[Cust_ Ledger Entry No_]
                WHERE c.[Cooperativa] = 1
                AND CONVERT(DATE, c.[Date Created]) >= '${startDate}'
            )
            SELECT 
                cb.*,
                th.[Receipt No_],
                th.[Store No_],
                tse.[Net Amount],
                i.[Attrib 2 Code],
                i.[Description] AS ItemDescription
            FROM ClientesBase cb
            LEFT JOIN [dbo].[PACASA$Transaction Header] th 
                ON cb.CustomerNo = th.[Customer No_]
            LEFT JOIN [dbo].[PACASA$Trans_ Sales Entry] tse 
                ON th.[Receipt No_] = tse.[Receipt No_]
                AND th.[Store No_] = tse.[Store No_]
            LEFT JOIN [dbo].[PACASA$Item] i 
                ON tse.[Item No_] = i.[No_]
        `;

        const results = await executeQuery(mainQuery);
        
        // Agrupar los resultados por cliente
        const groupedResults = results.reduce((acc, curr) => {
            const key = curr.CustomerNo;
            
            if (!acc[key]) {

                acc[key] = {
                    Categoria_Contado: curr['Categoria Contado'],
                    Cod_Segmento: curr['Cod Segmento'],
                    CustomerNo: curr.CustomerNo,
                    Payment_Terms_Code: curr['Payment Terms Code'],
                    Post_Code: curr['Post Code'],
                    CalificacionCrediticia: curr.CalificacionCrediticia,
                    Payment_Method_Code: curr['Payment Method Code'],
                    CustomerName: curr.CustomerName,
                    VAT_Registration_No: curr['VAT Registration No_'],
                    Segmento: curr.Segmento,
                    Customer_Posting_Group: curr['Customer Posting Group'],
                    CustomerEmail: curr.CustomerEmail,
                    ContactName: curr.ContactName,
                    ContactEmail: curr.ContactEmail,
                    Job_Responsibility_Code: curr['Job Responsibility Code'],
                    CodigoTemporada: curr['Id Temporada'] || '',
                    Entry_No: curr['Entry No_'],
                    Document_No: curr['Document No_'],
                    Attrib_2_Code: curr['Attrib 2 Code'],
                    transacciones: []
                };
            }
            
            // Si hay datos de transacción, agregarlos al array
            if (curr['Receipt No_']) {
                acc[key].transacciones.push({
                    Receipt_No: curr['Receipt No_'],
                    Store_No: curr['Store No_'],
                    Net_Amount: curr['Net Amount']
                });
            }
            
            return acc;
        }, {});

        const finalResults = Object.values(groupedResults);
        
        res.json({
            analysis: {
                totalClientes: finalResults.length,
                clientesConTransacciones: finalResults.filter(c => c.transacciones.length > 0).length,
                totalTransacciones: finalResults.reduce((sum, c) => sum + c.transacciones.length, 0)
            },
            results: finalResults
        });
    } catch (error) {
        console.error("Error en consulta cooperativa:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Endpoint para Fidelidad
app.get('/api/test/fidelidad-v6', async (req, res) => {
    const { startDate } = req.query;
    if (!startDate) {
        return res.status(400).json({ error: "El parámetro 'startDate' es obligatorio." });
    }
    
    try {
        const mainQuery = `
            WITH ClientesBase AS (
                SELECT DISTINCT
                -- Campos de Member Contact
                mc.[Blocked],
                mc.[City],
                mc.[Contact No_] AS ContactNo,
                mc.[E-Mail] AS MemberEmail,
                mc.[Date of Birth],
                mc.[Gender],
                mc.[Phone No_],
                mc.[Name] AS MemberName,
                mc.[E-Mail] AS Email,
                mc.[Phone No_] AS PhoneNo,           -- Asegurarnos que estos campos estén
                mc.[Mobile Phone No_] AS MobileNo,    -- incluidos en la consulta
                mc.[Created Date] AS FechaCreacion,

                -- Campos de Member Account
                ma.[Club Destino],
                ma.[Club Code],
                ma.[Scheme Code],
                ma.[No_] AS AccountNo,
                ma.[Cuenta Destino],
                    ma.[Description] AS AccountDescription,
                ma.[Origen],
                ma.[Porcentaje],
                ma.[Tarjeta destino],
                ma.[Account Type],
                ma.[Temporada],

                -- Campos de Member Point Entry
                mpe.[Closed by Points],
                mpe.[Member Club],
                mpe.[Member Scheme],
                mpe.[Date],
                mpe.[Expiration Date],
                mpe.[Account No_],
                    mpe.[Document No_] AS PointEntryDocNo,
                    mpe.[Store No_] AS PointEntryStoreNo,
                mpe.[POS Terminal No_],
                mpe.[Transaction No_],
                mpe.[Points],
                mpe.[Remaining Points],
                mpe.[Entry Type],
                mpe.[Source Type],
                mpe.[Point Type],

                -- Campos de Membership Card
                    mcard.[Card No_]

                FROM [dbo].[PACASA$Member Contact] mc 
                LEFT JOIN [dbo].[PACASA$Member Account] ma 
                    ON mc.[Contact No_] = ma.[No_]
                LEFT JOIN [dbo].[PACASA$Member Point Entry] mpe 
                    ON ma.[No_] = mpe.[Account No_]
                LEFT JOIN [dbo].[PACASA$Membership Card] mcard 
                    ON ma.[No_] = mcard.[Account No_]
                WHERE mpe.[Member Club] = 'FIDELIDAD'
                AND CONVERT(DATE, mc.[Created Date]) >= '${startDate}'
            )
            SELECT 
                cb.*,
                th.[Receipt No_],
                th.[Store No_],
                tse.[Net Amount],
                i.[Attrib 2 Code],
                i.[Description] AS ItemDescription
            FROM ClientesBase cb
            LEFT JOIN [dbo].[PACASA$Transaction Header] th 
                ON cb.ContactNo = th.[Customer No_]
            LEFT JOIN [dbo].[PACASA$Trans_ Sales Entry] tse 
                ON th.[Receipt No_] = tse.[Receipt No_]
                AND th.[Store No_] = tse.[Store No_]
            LEFT JOIN [dbo].[PACASA$Item] i 
                ON tse.[Item No_] = i.[No_]
        `;

        const results = await executeQuery(mainQuery);
        
        // Agrupar los resultados por contacto
        const groupedResults = results.reduce((acc, curr) => {
            const key = curr.ContactNo;
            
            if (!acc[key]) {
                acc[key] = {
                    // Datos del miembro
                    ContactNo: curr.ContactNo,
                    MemberName: curr.MemberName,
                    Blocked: curr.Blocked,
                    City: curr.City,
                    MemberEmail: curr.MemberEmail,
                    DateOfBirth: curr.DateOfBirth,
                    Gender: curr.Gender,
                    PhoneNo: curr.PhoneNo,
                    
                    // Datos de cuenta y puntos
                    AccountNo: curr.AccountNo,
                    ClubDestino: curr.ClubDestino,
                    ClubMiembro: curr['Member Club'],
                    CodigoClub: curr['Club Code'],
                    CodigoEsquema: curr['Scheme Code'],
                    EsquemaMiembro: curr['Member Scheme'],
                    ClubCode: curr.ClubCode,
                    SchemeCode: curr.SchemeCode,
                    CuentaDestino: curr.CuentaDestino,
                    AccountDescription: curr.AccountDescription,
                    Origen: curr.Origen,
                    Porcentaje: curr.Porcentaje,
                    TarjetaDestino: curr.TarjetaDestino,
                    AccountType: curr.AccountType,
                    Temporada: curr.Temporada,
                    
                    // Datos de puntos
                    ClosedByPoints: curr['Closed by Points'],
                    MemberClub: curr['Member Club'],
                    MemberScheme: curr['Member Scheme'],
                    Points: curr.Points,
                    RemainingPoints: curr['Remaining Points'],
                    EntryType: curr['Entry Type'],
                    SourceType: curr['Source Type'],
                    PointType: curr['Point Type'],
                    
                    // Datos de tarjeta
                    CardNo: curr['Card No_'],
                    
                    // Array para transacciones
                    transacciones: []
                };
            }
            
            if (curr['Receipt No_']) {
                acc[key].transacciones.push({
                    Receipt_No: curr['Receipt No_'],
                    Store_No: curr['Store No_'],
                    Net_Amount: curr['Net Amount'],
                    Attrib_2_Code: curr['Attrib 2 Code'],
                    ItemDescription: curr.ItemDescription
                });
            }
            
            return acc;
        }, {});

        const finalResults = Object.values(groupedResults);
        
        res.json({
            analysis: {
                totalMiembros: finalResults.length,
                miembrosConTransacciones: finalResults.filter(c => c.transacciones.length > 0).length,
                totalTransacciones: finalResults.reduce((sum, c) => sum + c.transacciones.length, 0)
            },
            results: finalResults
        });
    } catch (error) {
        console.error("Error en consulta fidelidad:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Endpoint para Licitación
app.get('/api/test/licitacion-v6', async (req, res) => {
    const { startDate } = req.query;
    if (!startDate) {
        return res.status(400).json({ error: "El parámetro 'startDate' es obligatorio." });
    }
    
    try {
        const mainQuery = `
            WITH ClientesBase AS (
                SELECT DISTINCT
                    c.[Categoria Contado],
                    c.[Cod Segmento],
                    c.[No_] AS CustomerNo,
                    c.[Payment Terms Code],
                    c.[Post Code],
                    c.[CalificacionCrediticia],
                    c.[Payment Method Code],
                    c.[Name] AS CustomerName,
                    c.[VAT Registration No_],
                    c.[Segmento],
                    c.[Customer Posting Group],
                    c.[E-Mail] AS CustomerEmail,
            cont.[Name] AS ContactName,
                    cont.[E-Mail] AS ContactEmail,
                    cjr.[Job Responsibility Code],
                    sh.[Status],
                    sh.[Document Type],
                    sh.[No_] AS SalesHeaderNo,
                    sl.[Amount Including VAT] AS Amount,
                    tc.[Id Temporada] AS CodigoTemporada,
                    cle.[Entry No_],
                    dcle.[Document No_],
                    i.[Attrib 2 Code] AS Attrib_2_Code
                FROM [dbo].[PACASA$Customer] c
            LEFT JOIN [dbo].[PACASA$Contact] cont 
                    ON c.[No_] = cont.[Company No_]
            LEFT JOIN [dbo].[PACASA$Contact Job Responsibility] cjr 
                ON cont.[No_] = cjr.[Contact No_]
            LEFT JOIN [dbo].[PACASA$Sales Header] sh 
                ON c.[No_] = sh.[Sell-to Customer No_]
            LEFT JOIN [dbo].[PACASA$Sales Line] sl 
                ON sh.[No_] = sl.[Document No_]
            LEFT JOIN [dbo].[PACASA$Item] i 
                ON sl.[No_] = i.[No_]
                LEFT JOIN [dbo].[PACASA$Temporadas Clientes] tc 
                    ON c.[No_] = tc.[Customer No_]
            LEFT JOIN [PACASA$Cust_ Ledger Entry] cle 
                ON c.[No_] = cle.[Customer No_]
            LEFT JOIN [PACASA$Detailed Cust_ Ledg_ Entry] dcle 
                ON cle.[Entry No_] = dcle.[Cust_ Ledger Entry No_]
                WHERE c.[Customer Posting Group] = 'CLIENTELIC'
                AND (sh.[No_] IS NOT NULL OR c.[Date Created] >= '${startDate}')
            )
            SELECT 
                CustomerNo,
                CustomerName,
                [Categoria Contado] AS CategoriaContado,
                [Cod Segmento] AS CodSegmento,
                [Payment Terms Code] AS PaymentTermsCode,
                CalificacionCrediticia,
                [Payment Method Code] AS PaymentMethodCode,
                [VAT Registration No_] AS VATRegistrationNo,
                Segmento,
                [Customer Posting Group] AS CustomerPostingGroup,
                CustomerEmail,
                ContactName,
                ContactEmail,
                [Job Responsibility Code] AS JobResponsibilityCode,
                Status,
                [Document Type] AS DocumentType,
                CodigoTemporada,
                [Entry No_] AS EntryNo,
                [Document No_] AS DocumentNo,
                Amount,
                Attrib_2_Code
            FROM ClientesBase`;

        const results = await executeQuery(mainQuery);
        
        const groupedResults = results.reduce((acc, curr) => {
            const key = curr.CustomerNo;
            
            if (!acc[key]) {
                acc[key] = {
                    CustomerNo: curr.CustomerNo,
                    CustomerName: curr.CustomerName,
                    CategoriaContado: curr.CategoriaContado,
                    CodSegmento: curr.CodSegmento,
                    PaymentTermsCode: curr.PaymentTermsCode,
                    CalificacionCrediticia: curr.CalificacionCrediticia,
                    PaymentMethodCode: curr.PaymentMethodCode,
                    VATRegistrationNo: curr.VATRegistrationNo,
                    Segmento: curr.Segmento,
                    CustomerPostingGroup: curr.CustomerPostingGroup,
                    CustomerEmail: curr.CustomerEmail,
                    ContactName: curr.ContactName,
                    ContactEmail: curr.ContactEmail,
                    JobResponsibilityCode: curr.JobResponsibilityCode,
                    Status: curr.Status,
                    DocumentType: curr.DocumentType,
                    CodigoTemporada: curr.CodigoTemporada || 'NORMAL',
                    EntryNo: curr.EntryNo,
                    DocumentNo: curr.DocumentNo,
                    Amount: curr.Amount || 0,
                    Attrib_2_Code: curr.Attrib_2_Code || ''
                };
            }
            
            return acc;
        }, {});

        const finalResults = Object.values(groupedResults);
        
        res.json({
            analysis: {
                totalClientes: finalResults.length,
                clientesConVentas: finalResults.filter(c => c.Amount > 0).length,
                montoTotal: finalResults.reduce((sum, c) => sum + (c.Amount || 0), 0)
            },
            results: finalResults
        });
    } catch (error) {
        console.error("Error en consulta licitacion:", error);
        res.status(500).json({ error: error.message });
    }
});

// Iniciar la aplicación
app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
    if (process.send) {
        process.send('ready');  // Enviar señal de ready a PM2
    }
});
