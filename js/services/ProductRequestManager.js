class ProductRequestManager {
    static BASE_API_URL = window.APP_CONFIG.API_BASE_URL;

    static _getHeaders(contentType = "application/json") {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": contentType,
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = "/signIn.html";
            }
            throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        return data;
    }

    static async createRequest(payload) {
        const res = await fetch(`${this.BASE_API_URL}/vendor/product-request`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }


    static async getRequestsByVendorId(vendorId) {
        const res = await fetch(`${this.BASE_API_URL}/vendor/product-requests/${vendorId}`, {
            method: "GET",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }
}

window.ProductRequestManager = ProductRequestManager;