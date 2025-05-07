const getUnifiedQuery = (startDate) => `
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
            dcle.[Document No_],
            c.[Date Created]
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
        AND c.[Date Created] >= '${startDate}'
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

const getUnifiedUpdatedQuery = (startDate) => `
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
            dcle.[Document No_],
            c.[Last Date Modified]
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
        AND c.[Last Date Modified] >= '${startDate}'
        AND c.[Date Created] < '${startDate}'
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

const getCooperativaQuery = (startDate) => `
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
            dcle.[Document No_],
            c.[Date Created]
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
        AND c.[Date Created] >= '${startDate}'
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

const getCooperativaUpdatedQuery = (startDate) => `
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
            dcle.[Document No_],
            c.[Last Date Modified]
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
        AND c.[Last Date Modified] >= '${startDate}'
        AND c.[Date Created] < '${startDate}'
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

const getFidelidadQuery = (startDate) => `
    WITH ClientesBase AS (
        SELECT DISTINCT
            mc.[Blocked],
            mc.[City],
            mc.[Contact No_] AS ContactNo,
            mc.[E-Mail] AS MemberEmail,
            mc.[Date of Birth],
            mc.[Gender],
            mc.[Phone No_],
            mc.[Name] AS MemberName,
            mc.[E-Mail] AS Email,
            mc.[Phone No_] AS PhoneNo,
            mc.[Mobile Phone No_] AS MobileNo,
            mc.[Created Date] AS FechaCreacion,
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

const getLicitacionQuery = (startDate) => `
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
            i.[Attrib 2 Code] AS Attrib_2_Code,
            c.[Date Created]
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
        AND c.[Date Created] >= '${startDate}'
    )
    SELECT * FROM ClientesBase
`;

const getLicitacionUpdatedQuery = (startDate) => `
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
            i.[Attrib 2 Code] AS Attrib_2_Code,
            c.[Last Date Modified]
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
        AND c.[Last Date Modified] >= '${startDate}'
        AND c.[Date Created] < '${startDate}'
    )
    SELECT * FROM ClientesBase
`;

module.exports = {
    getUnifiedQuery,
    getUnifiedUpdatedQuery,
    getCooperativaQuery,
    getCooperativaUpdatedQuery,
    getFidelidadQuery,
    getLicitacionQuery,
    getLicitacionUpdatedQuery
};