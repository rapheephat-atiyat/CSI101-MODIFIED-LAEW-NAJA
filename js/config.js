const BASE_URL = "https://csi101.rapheephat.site";
const API_BASE_URL = `${BASE_URL}/api`;

/**
 * 
 * @param {number} price 
 * @returns {string}
 */
function formatCurrency(price) {
    if (price === null || price === undefined || isNaN(price)) return '฿0.00';
    return `฿${parseFloat(price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
}

/**
 * 
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Intl.DateTimeFormat('th-TH', options).format(new Date(dateString));
    } catch (e) {
        return new Date(dateString).toLocaleDateString('th-TH');
    }
}

window.APP_CONFIG = {
    BASE_URL,
    API_BASE_URL
};
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;