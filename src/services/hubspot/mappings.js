const { cleanRTN } = require('../../utils/validators');
const { unidadDeNegocio1, segmentoMap } = require('../../constants/mappings');
const { getDepartamentoFromPostCode } = require('./contact');

const normalizeSegmento = (segmento) => {
    if (!segmento) return 'Comercializadora';
    const upperSegmento = segmento.toUpperCase();
    return segmentoMap[upperSegmento] || 'Comercializadora';
};

const contactMappings = {
    'mayoreo-tienda': (data) => ({
        email: data.CustomerEmail || data.ContactEmail,
        firstname: data.CustomerName || data.ContactName,
        company: data.CustomerName,
        rtn: cleanRTN(data.VAT_Registration_No),
        segmento: normalizeSegmento(data.Segmento),
        departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
        categorizacion: data.Categoria_Contado || '',
        codigo_de_segmento: data.Cod_Segmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.Payment_Terms_Code || '',
        documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
        metodo_de_pago_contado: data.Payment_Method_Code || '',
        representante_legal: data.ContactName || '',
        responsable_de_compra: data.Job_Responsibility_Code || '',
        tipo_de_credito: data.CodigoTemporada || 'NORMAL',
        unidad_de_negocio_dynamics: unidadDeNegocio1[data.Customer_Posting_Group] || ''
    }),

    'fidelidad': (data) => ({
        email: data.MemberEmail,
        firstname: data.MemberName,
        phone: data.PhoneNo,
        club_miembros: data.ClubMiembro,
        cod_club: data.CodigoClub,
        cod_esquema: data.CodigoEsquema,
        esquema_membresia: data.EsquemaMiembro,
        bloqueado: data.Blocked || '',
        categorizacion: data.ClubDestino || '',
        city: data.City || '',
        club_destino: data.ClubDestino || '',
        codigo_de_la_escuela: data.AccountNo || '',
        confirmar_dni: data.ContactNo || '',
        contacto_principal: data.MemberName || '',
        cuenta_destino: data.CuentaDestino || '',
        dni: data.ContactNo || '',
        fecha_member_point_entry: data.Date || '',
        fecha_caducidad: data['Expiration Date'] || '',
        fecha_de_nacimiento: data['Date of Birth'] || '',
        gender: data.Gender || '',
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
        tipo_mov_: data.EntryType || '',
        tipo_procedencia_mov_: data.SourceType || '',
        tipo_puntos: data.PointType || '',
        cerrado_por_puntos: data.ClosedByPoints || ''
    }),

    'licitacion': (data) => ({
        email: data.CustomerEmail || data.ContactEmail,
        firstname: data.CustomerName || data.ContactName,
        company: data.CustomerName,
        rtn: cleanRTN(data.VATRegistrationNo),
        segmento: normalizeSegmento(data.Segmento),
        categorizacion: data.CategoriaContado || '',
        codigo_de_segmento: data.CodSegmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.PaymentTermsCode || '',
        documetacion_de_politicas_de_pago__credito_: data.CalificacionCrediticia || '',
        metodo_de_pago_contado: data.PaymentMethodCode || '',
        representante_legal: data.ContactName || '',
        responsable_de_compra: data.JobResponsibilityCode || '',
        tipo_de_credito: data.CodigoTemporada || 'NORMAL',
        unidad_de_negocio_dynamics: unidadDeNegocio1[data.CustomerPostingGroup] || ''
    })
};

const dealMappings = {
    'mayoreo-tienda': (data, commonProps) => ({
        ...commonProps,
        categorizacion: data.Categoria_Contado || '',
        codigo_de_segmento: data.Cod_Segmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.Payment_Terms_Code || '',
        departamentos_mayoreo: getDepartamentoFromPostCode(data.Post_Code),
        monto_neto: data.Net_Amount || 0,
        rtn: cleanRTN(data.VAT_Registration_No),
        segmento: normalizeSegmento(data.Segmento)
    }),

    'licitacion': (data, commonProps) => ({
        ...commonProps,
        categorizacion: data.CategoriaContado || '',
        codigo_de_segmento: data.CodSegmento || '',
        codigo_del_cliente: data.CustomerNo || '',
        condiciones_de_pago: data.PaymentTermsCode || '',
        monto_neto: data.Amount || 0,
        rtn: cleanRTN(data.VATRegistrationNo),
        segmento: normalizeSegmento(data.Segmento)
    })
};

module.exports = {
    contactMappings,
    dealMappings,
    normalizeSegmento
};