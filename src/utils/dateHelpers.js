const getLast24HoursDate = () => {
    const now = new Date();
    now.setHours(now.getHours() - 24);
    return now.toISOString();
};

module.exports = {
    getLast24HoursDate
};