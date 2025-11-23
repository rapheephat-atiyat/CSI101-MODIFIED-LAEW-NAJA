class VendorManager {
    static BASE_API_URL = window.APP_CONFIG.API_BASE_URL;

    static _getHeaders() {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = "/signIn.html";
            }
            throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        return data;
    }

    static async register(payload) {
        const res = await fetch(`${this.BASE_API_URL}/api/vendor/register`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }

    static async getRequestStatus() {
        const res = await fetch(`${this.BASE_API_URL}/api/vendor/request-status`, {
            method: "GET",
            headers: this._getHeaders(),
        });

        if (res.status === 401) {
            return { data: { status: 'NOT_APPLIED' } };
        }

        return this._handleResponse(res);
    }
}

window.VendorManager = VendorManager;