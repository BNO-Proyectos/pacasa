const express = require('express');
const { executeQuery } = require('../../config/database');
const { 
    getUnifiedQuery, 
    getCooperativaQuery, 
    getFidelidadQuery, 
    getLicitacionQuery,
    getUnifiedUpdatedQuery,
    getCooperativaUpdatedQuery,
    getLicitacionUpdatedQuery
} = require('./queries');

const router = express.Router();

// Middleware para validar startDate
const validateStartDate = (req, res, next) => {
    const { startDate } = req.query;
    if (!startDate) {
        return res.status(400).json({ error: "El parámetro 'startDate' es obligatorio." });
    }
    next();
};

// Endpoint para Mayoreo-Tienda
router.get('/unified-v6', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getUnifiedQuery(req.query.startDate));
        
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

// Endpoint para Cooperativa
router.get('/cooperativa-v6', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getCooperativaQuery(req.query.startDate));
        
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

// Endpoint para Fidelidad
router.get('/fidelidad-v6', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getFidelidadQuery(req.query.startDate));
        
        const groupedResults = results.reduce((acc, curr) => {
            const key = curr.ContactNo;
            
            if (!acc[key]) {
                acc[key] = {
                    ContactNo: curr.ContactNo,
                    MemberName: curr.MemberName,
                    Blocked: curr.Blocked,
                    City: curr.City,
                    MemberEmail: curr.MemberEmail,
                    DateOfBirth: curr.DateOfBirth,
                    Gender: curr.Gender,
                    PhoneNo: curr.PhoneNo,
                    AccountNo: curr.AccountNo,
                    ClubDestino: curr.ClubDestino,
                    ClubMiembro: curr['Member Club'],
                    CodigoClub: curr['Club Code'],
                    CodigoEsquema: curr['Scheme Code'],
                    EsquemaMiembro: curr['Member Scheme'],
                    AccountDescription: curr.AccountDescription,
                    Origen: curr.Origen,
                    Porcentaje: curr.Porcentaje,
                    Temporada: curr.Temporada,
                    ClosedByPoints: curr['Closed by Points'],
                    MemberClub: curr['Member Club'],
                    MemberScheme: curr['Member Scheme'],
                    Points: curr.Points,
                    RemainingPoints: curr['Remaining Points'],
                    EntryType: curr['Entry Type'],
                    SourceType: curr['Source Type'],
                    PointType: curr['Point Type'],
                    CardNo: curr['Card No_'],
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

// Endpoint para Licitación
router.get('/licitacion-v6', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getLicitacionQuery(req.query.startDate));
        
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

// Para mayoreo actualizados
router.get('/unified-v6/updated', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getUnifiedUpdatedQuery(req.query.startDate));
        
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
        console.error("Error en consulta mayoreo-tienda actualizados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Para cooperativa actualizados
router.get('/cooperativa-v6/updated', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getCooperativaUpdatedQuery(req.query.startDate));
        
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
        console.error("Error en consulta cooperativa actualizados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Para licitación actualizados
router.get('/licitacion-v6/updated', validateStartDate, async (req, res) => {
    try {
        const results = await executeQuery(getLicitacionUpdatedQuery(req.query.startDate));
        
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
        console.error("Error en consulta licitación actualizados:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;