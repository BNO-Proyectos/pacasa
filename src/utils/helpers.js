const getLastValidTransaction = (transacciones) => {
    if (!transacciones?.length) return null;
    const validTransactions = transacciones
        .filter(t => t.Net_Amount != null)
        .sort((a, b) => b.Transaction_No - a.Transaction_No);
    return validTransactions[0] || null;
};

const cleanRTN = (rtn) => {
    if (!rtn) return '';
    return rtn.replace(/\D/g, '');
};

module.exports = {
    getLastValidTransaction,
    cleanRTN
}; 